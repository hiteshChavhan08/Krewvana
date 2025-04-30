// lib/api/dashboardApi.ts
import {
  type UserProfileSubset,
  type ActivityItem,
  formatShoutoutType,
} from "@/types/dashboard"; // Adjust path
import { ShoutoutType } from "@prisma/client";

export async function fetchCurrentUserProfile(): Promise<UserProfileSubset> {
  const response = await fetch("/api/users/me");
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "API Error (fetchCurrentUserProfile):",
      response.status,
      errorText
    );
    throw new Error(
      `Failed to fetch user profile (status: ${response.status})`
    );
  }
  const data = await response.json();
  // Provide default points if missing/invalid
  const points = typeof data.points === "number" ? data.points : 0;
  return { name: data.name, points: points };
}

export async function fetchRecentActivity(
  limit: number = 5
): Promise<ActivityItem[]> {
  try {
    const [kudosRes, shoutoutsRes] = await Promise.all([
      fetch(`/api/kudos?limit=${limit}`),
      fetch(`/api/shoutouts?limit=${limit}`),
    ]);

    // Log warnings but don't throw for non-critical stream failures
    if (!kudosRes.ok)
      console.warn(`Failed to fetch kudos stream (status: ${kudosRes.status})`);
    if (!shoutoutsRes.ok)
      console.warn(
        `Failed to fetch shoutouts stream (status: ${shoutoutsRes.status})`
      );

    const kudosData = kudosRes.ok ? await kudosRes.json() : [];
    const shoutoutsData = shoutoutsRes.ok ? await shoutoutsRes.json() : [];

    // Transform data safely
    const combined: ActivityItem[] = [
      ...kudosData.map((k: any) => ({
        id: `k-${k.id}`,
        type: "kudos" as const,
        message: k.message || "",
        createdAt: k.createdAt,
        actorName: k.giver?.name,
        actorImage: k.giver?.image,
        receiverName: k.receiver?.name,
        receiverImage: k.receiver?.image,
      })),
      ...shoutoutsData.map((s: any) => ({
        id: `s-${s.id}`,
        type: "shoutout" as const,
        message: s.message || "",
        createdAt: s.createdAt,
        actorName: s.submittedBy?.name,
        actorImage: s.submittedBy?.image,
        shoutoutType: formatShoutoutType(s.type as ShoutoutType | undefined), // Format type
      })),
    ];

    // Sort by date descending
    combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return combined.slice(0, limit); // Apply limit after combining and sorting
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    // Depending on requirements, you might want to throw or return empty
    // Returning empty allows the dashboard to render partially
    return [];
  }
}

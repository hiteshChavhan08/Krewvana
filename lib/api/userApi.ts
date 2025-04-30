// lib/api/userApi.ts (Example location)

import { type UserProfile, type ProfileFormData } from "@/types/user"; // Adjust path

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch("/api/users/me");
  if (!response.ok) {
    // Consider more specific error handling based on status code
    const errorText = await response.text();
    console.error("API Error Response:", errorText);
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
}

export async function updateUserProfile(
  data: Partial<ProfileFormData>
): Promise<UserProfile> {
  // Assuming API returns the updated profile subset
  const response = await fetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let errorMsg = "Failed to update profile";
    try {
      const errorData = await response.json();
      // Prefer detailed validation errors if available
      const validationError =
        errorData.details?.[0]?.message ||
        errorData.errors?.[Object.keys(errorData.errors)[0]]?.[0];
      errorMsg =
        validationError || errorData.error || errorData.message || errorMsg;
    } catch (e) {
      // Ignore if response is not JSON
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

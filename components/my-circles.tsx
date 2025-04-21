// app/mentorship/_components/my-circles.tsx
import { CircleCard, CircleCardData } from "./circle-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NotebookPen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MembershipStatus } from "@prisma/client";

interface MyCirclesProps {
  userId: string;
}

// Function to fetch circles the user is part of
async function getUserCircles(userId: string): Promise<CircleCardData[]> {
  try {
    // Fetch directly OR use API: '/api/mentorship/circles?view=my'
    const circles = await prisma.mentorshipCircle.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            // Optionally filter by status (e.g., only ACTIVE or PENDING memberships)
            // status: { in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING] }
          },
        },
      },
      include: {
        skill: true,
        creator: { select: { id: true, name: true, image: true } },
        members: {
          // Fetch active members for display
          where: { status: MembershipStatus.ACTIVE },
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: {
          select: { members: { where: { status: MembershipStatus.ACTIVE } } },
        },
      },
      orderBy: [
        { status: 'asc' },    // Sort by status first (e.g., ACTIVE before COMPLETED)
        { createdAt: 'desc' } // Then sort by newest within each status
     ], // Show active/forming first
    });
    return circles as CircleCardData[];
  } catch (error) {
    console.error(`Error fetching circles for user ${userId}:`, error);
    return [];
  }
}

export async function MyCircles({ userId }: MyCirclesProps) {
  const circles = await getUserCircles(userId);

  if (circles.length === 0) {
    return (
      <Alert>
        <NotebookPen className="h-4 w-4" />
        <AlertTitle>You Haven't Joined Any Circles Yet</AlertTitle>
        <AlertDescription>
          Explore the "Discover Circles" tab to find mentorship opportunities or
          propose your own!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {circles.map((circle) => (
        <CircleCard key={circle.id} circle={circle} />
      ))}
    </div>
  );
}

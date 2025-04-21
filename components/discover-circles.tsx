// components/discover-circles.tsx
import { CircleCard, CircleCardData } from "./circle-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { prisma } from "@/lib/prisma"; // Assuming direct prisma access for RSC, or use fetch to API route
import { MentorshipCircleStatus, MembershipStatus } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react"; // Import Suspense
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

// --- Loading Skeleton Component ---
function CirclesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map(
        (
          _,
          i // Show 3 skeleton cards
        ) => (
          <Card key={i} className="h-full flex flex-col">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" /> {/* Title */}
              <Skeleton className="h-4 w-1/3 mb-3" /> {/* Skill Badge */}
              <Skeleton className="h-4 w-full" /> {/* Description Line 1 */}
              <Skeleton className="h-4 w-5/6" /> {/* Description Line 2 */}
            </CardHeader>
            <CardContent className="flex-grow">
              <Skeleton className="h-4 w-1/2 mb-4" /> {/* Member Count */}
              <Skeleton className="h-4 w-1/4 mb-1" /> {/* Mentor Label */}
              <Skeleton className="h-6 w-3/4" /> {/* Mentor Avatar+Name */}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-4 w-1/3" /> {/* Created Date */}
            </CardFooter>
          </Card>
        )
      )}
    </div>
  );
}

// --- Data Fetching Component ---
async function FetchDiscoverCircles() {
  // Use the existing getDiscoverableCircles logic here (or API fetch)
  const circles = await getDiscoverableCircles(); // Assume this function exists

  if (circles.length === 0) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>No Circles Found</AlertTitle>
        <AlertDescription>
          {" "}
          There are currently no active or forming mentorship circles. Why not
          propose one?{" "}
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

// Function to fetch data server-side
async function getDiscoverableCircles(): Promise<CircleCardData[]> {
  try {
    // Fetch directly from DB in RSC, OR fetch from '/api/mentorship/circles?status=FORMING&status=ACTIVE'
    const circles = await prisma.mentorshipCircle.findMany({
      where: {
        status: {
          in: [MentorshipCircleStatus.FORMING, MentorshipCircleStatus.ACTIVE],
        },
      },
      include: {
        skill: true,
        creator: { select: { id: true, name: true, image: true } },
        members: {
          // Fetch active members needed for display
          where: { status: MembershipStatus.ACTIVE },
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: {
          // Use count aggregation
          select: { members: { where: { status: MembershipStatus.ACTIVE } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ensure createdAt is serializable (string) if passing from RSC to Client Component later
    // If CircleCard remains RSC or used directly here, Date object is fine.
    // For now, assuming direct use in RSC or CircleCard is also RSC compatible
    return circles as CircleCardData[]; // Cast might be needed depending on exact type match
  } catch (error) {
    console.error("Error fetching discoverable circles:", error);
    return []; // Return empty array on error
  }
}

export async function DiscoverCircles() {
  return (
    // Use CSS Grid for responsive layout
    <Suspense fallback={<CirclesLoadingSkeleton />}>
      
      <FetchDiscoverCircles />
    </Suspense>
  );
}

// app/app/mentorship/circles/[circleId]/page.tsx

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { getCurrentUser } from "@/lib/auth"; // Adjust path if needed
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  PlayCircle,
  StopCircle,
  Edit2,
  Building,
} from "lucide-react";
import {
  MentorshipCircleStatus,
  MembershipStatus,
  MentorshipRole,
} from "@prisma/client"; // Import Enums
import { CircleActions } from "@/components/circle-actions"; // Import Client Component
import { MemberList } from "@/components/member-list"; // Import Client Component
import { Separator } from "@/components/ui/separator"; // For visual separation
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const getInitials = (name?: string | null): string => {
  if (!name?.trim()) return "??";
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

// Type definition for badge variants for better type safety
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
// --- Loading Skeleton for Detail Page ---
function DetailPageSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6 lg:px-8 space-y-8">
      {/* Header Skeleton */}
      <div>
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-9 w-3/5" /> {/* Title */}
          <Skeleton className="h-10 w-32" /> {/* Action Button Placeholder */}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5">
          <Skeleton className="h-6 w-24" /> {/* Status Badge */}
          <Skeleton className="h-6 w-32" /> {/* Skill Badge */}
          <Skeleton className="h-5 w-28" /> {/* Member Count */}
          <Skeleton className="h-5 w-36" /> {/* Created Date */}
        </div>
        <Skeleton className="h-5 w-full mt-2" /> {/* Description Line 1 */}
        <Skeleton className="h-5 w-11/12 mt-1" /> {/* Description Line 2 */}
      </div>
      <Separator />
      {/* Mentor Skeleton */}
      <section>
        <Skeleton className="h-7 w-32 mb-4" /> {/* Mentor Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full" />
        </div>
      </section>
      {/* Member List Skeleton */}
      <section>
        <Skeleton className="h-7 w-32 mb-4" /> {/* Mentee Title */}
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </section>
    </div>
  );
}

const getStatusBadgeVariant = (
  status: MentorshipCircleStatus
): BadgeVariant => {
  switch (status) {
    // Map ACTIVE to 'default' or 'secondary', we'll style it further with className
    case MentorshipCircleStatus.ACTIVE:
      return "default";
    // Map FORMING to 'secondary'
    case MentorshipCircleStatus.FORMING:
    case MentorshipCircleStatus.PROPOSED:
    case MentorshipCircleStatus.PENDING_APPROVAL:
      return "secondary";
    // Map COMPLETED to 'outline'
    case MentorshipCircleStatus.COMPLETED:
      return "outline";
    // Map CANCELLED to 'destructive'
    case MentorshipCircleStatus.CANCELLED:
      return "destructive";
    // Default fallback
    default:
      return "secondary";
  }
};
const getStatusIcon = (status: MentorshipCircleStatus) => {
  switch (status) {
    case MentorshipCircleStatus.ACTIVE:
      return <PlayCircle className="h-4 w-4 mr-1 text-success-foreground" />; // Assuming success variant styles foreground
    case MentorshipCircleStatus.FORMING:
      return <Clock className="h-4 w-4 mr-1" />;
    case MentorshipCircleStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4 mr-1" />;
    case MentorshipCircleStatus.CANCELLED:
      return <StopCircle className="h-4 w-4 mr-1 text-destructive" />;
    case MentorshipCircleStatus.PROPOSED:
    case MentorshipCircleStatus.PENDING_APPROVAL:
      return <Edit2 className="h-4 w-4 mr-1" />;
    default:
      return <AlertCircle className="h-4 w-4 mr-1" />;
  }
};

// --- Data Fetching Function ---
async function getCircleDetails(circleId: string) {
  if (!circleId || typeof circleId !== "string") {
    console.error("Invalid circleId provided to getCircleDetails:", circleId);
    notFound();
  }
  try {
    const circle = await prisma.mentorshipCircle.findUnique({
      where: { id: circleId },
      include: {
        skill: true, // Include details of the skill/topic
        creator: {
          // Include basic creator info
          select: { id: true, name: true, image: true },
        },
        members: {
          // Include ALL members and their user details for this page
          include: {
            user: {
              select: { id: true, name: true, image: true, email: true },
            }, // Include email for potential contact
          },
          orderBy: [
            // Sort members logically for display
            { role: "asc" }, // Mentors first
            { status: "asc" }, // Pending before Active, etc.
            { joinedAt: "asc" }, // Then by join date
          ],
        },
        _count: {
          // Efficiently count *active* members for display
          select: { members: { where: { status: MembershipStatus.ACTIVE } } },
        },
      },
    });

    if (!circle) {
      notFound(); // Trigger Next.js 404 page if circle doesn't exist
    }
    return circle;
  } catch (error) {
    console.error("Error fetching circle details:", error);
    // In a real app, you might want to log this error to a monitoring service
    // For now, treat it as not found.
    notFound();
  }
}

async function CircleDetailContent({ circleId }: { circleId: string }) {
  // const { circleId } = await params;

  // Fetch circle details and current user simultaneously
  const [circle, currentUser] = await Promise.all([
    getCircleDetails(circleId),
    getCurrentUser(), // Fetch current user session/data
  ]);

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    redirect(`/api/auth/signin?callbackUrl=/mentorship/circles/${circleId}`);
  }

  // Although getCircleDetails calls notFound(), this check is redundant but safe.
  if (!circle) return null;

  // --- Determine user's relationship to the circle ---
  const currentUserMembership =
    circle.members.find((m) => m.userId === currentUser.id) ?? null; // Use null if not found
  const isMentor =
    currentUserMembership?.role === MentorshipRole.MENTOR &&
    currentUserMembership?.status === MembershipStatus.ACTIVE;
  const isAdmin = false; // Placeholder: Implement actual admin check if needed (e.g., currentUser.role === 'ADMIN')

  // Separate members for clarity in rendering
  const mentors = circle.members.filter(
    (m) =>
      m.role === MentorshipRole.MENTOR && m.status === MembershipStatus.ACTIVE
  );

  // Convert dates to strings for client component props if necessary, although passing Date objects often works
  // Example (if needed):
  // const serializableMembers = circle.members.map(m => ({ ...m, joinedAt: m.joinedAt.toISOString() }));

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6 lg:px-8">
      {" "}
      {/* Constrain width */}
      {/* --- Header Section --- */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
          <h1 className="text-3xl font-bold leading-tight">{circle.title}</h1>
          {/* Actions Button Group (Client Component) */}
          <CircleActions
            circle={{
              // Pass only needed data subset for actions
              id: circle.id,
              status: circle.status,
              maxMentees: circle.maxMentees,
              _count: circle._count,
            }}
            currentUserMembership={currentUserMembership}
            isMentor={isMentor}
            isAdmin={isAdmin}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-5">
          <Badge
            variant={getStatusBadgeVariant(circle.status)}
            className="capitalize text-xs inline-flex items-center"
          >
            {getStatusIcon(circle.status)}
            {circle.status.toLowerCase().replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="inline-flex items-center">
            <Building className="h-3 w-3 mr-1" /> {/* Example icon for skill */}
            {circle.skill.name}
          </Badge>
          <div className="inline-flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {circle._count.members} Active Member
            {circle._count.members !== 1 ? "s" : ""}
            {circle.maxMentees !== null && ` / ${circle.maxMentees} Max`}
          </div>
          <div className="inline-flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Created{" "}
            {new Date(circle.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        {circle.description && (
          <p className="text-base text-foreground/80">{circle.description}</p> // Use slightly muted foreground
        )}
      </div>
      <Separator className="mb-8" />
      {/* --- Mentor(s) Section --- */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-primary" /> Mentor(s)
        </h2>
        {mentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="flex items-center space-x-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={mentor.user.image ?? undefined}
                    alt={mentor.user.name ?? "Mentor"}
                  />
                  <AvatarFallback>
                    {getInitials(mentor.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {mentor.user.name ?? "Unnamed Mentor"}
                  </p>
                  {/* Consider privacy before showing email widely */}
                  <p className="text-xs text-muted-foreground">
                    {mentor.user.email}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              No active mentor assigned to this circle yet.
            </p>
          </Card>
        )}
      </section>
      {/* --- Member List Section (Client Component) --- */}
      <section>
        <MemberList
          circleId={circle.id}
          members={circle.members} // Pass all members (Client component will filter)
          currentUserMembership={currentUserMembership}
          isMentor={isMentor}
          isAdmin={isAdmin}
        />
      </section>
    </div>
  );
}

// --- Page Component ---
export default async function CircleDetailPage({
  params,
}: {
  params: { circleId: string };
}) {
  const { circleId } =  await params;
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <CircleDetailContent circleId={circleId} />
    </Suspense>
  );
}

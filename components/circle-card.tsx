// components/circle-card.tsx
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock, CheckCircle } from "lucide-react"; // Import icons
import { MentorshipCircleStatus, MentorshipRole } from "@prisma/client";
import { getInitials } from "@/lib/utils/helpers";
import { formatShortDate } from "@/lib/utils/date-helpers";

// Define a type for the circle data expected by the card
// Adjust based on the actual data returned by your API endpoint
export type CircleCardData = {
  id: string;
  title: string;
  description: string | null;
  status: MentorshipCircleStatus;
  maxMentees: number | null;
  skill: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  members: Array<{ // Only include active members for display counts/mentors
    id: string;
    role: MentorshipRole;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    }
  }>;
   _count: { // From Prisma count aggregation
       members: number;
   };
  createdAt: string | Date; // Use string if serialized, Date otherwise
};


// Helper for status badge styling
const getStatusBadgeVariant = (status: MentorshipCircleStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case MentorshipCircleStatus.ACTIVE: return "default"; // Or maybe 'success' if you add custom variants
        case MentorshipCircleStatus.FORMING: return "secondary";
        case MentorshipCircleStatus.COMPLETED: return "outline";
        case MentorshipCircleStatus.CANCELLED: return "destructive";
        default: return "outline";
    }
}

interface CircleCardProps {
  circle: CircleCardData;
}

export function CircleCard({ circle }: CircleCardProps) {
  const mentors = circle.members.filter(m => m.role === MentorshipRole.MENTOR);
  const activeMemberCount = circle._count.members; // Use the efficient count

  return (
    <Link href={`/app/mentorship/circles/${circle.id}`} className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
      <Card className="h-full flex flex-col"> {/* Ensure card takes full height for grid layouts */}
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold">{circle.title}</CardTitle>
            <Badge variant={getStatusBadgeVariant(circle.status)} className="capitalize text-xs">
              {circle.status.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
           <Badge variant="outline" className="w-fit">{circle.skill.name}</Badge>
          {circle.description && (
             <CardDescription className="text-sm text-muted-foreground pt-1 line-clamp-2"> {/* Limit description lines */}
                {circle.description}
            </CardDescription>
          )}

        </CardHeader>
        <CardContent className="flex-grow"> {/* Make content grow to push footer down */}
           <div className="flex items-center space-x-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    {activeMemberCount} Active Member{activeMemberCount !== 1 ? 's' : ''}
                    {circle.maxMentees !== null && ` / ${circle.maxMentees} Max`}
                </span>
           </div>
           {mentors.length > 0 && (
             <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Mentor(s):</p>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {mentors.map(mentor => (
                         <div key={mentor.id} className="flex items-center space-x-1">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={mentor.user.image ?? undefined} alt={mentor.user.name ?? 'Mentor'} />
                                <AvatarFallback className="text-xs">{getInitials(mentor.user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{mentor.user.name ?? 'Unnamed Mentor'}</span>
                         </div>
                    ))}
                </div>
             </div>
           )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
            <span>Created {formatShortDate(circle.createdAt)}</span>
            {/* Optionally add an icon or text indicating if user can join */}
        </CardFooter>
      </Card>
    </Link>
  );
}
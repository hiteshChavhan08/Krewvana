// app/app/ama/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, HelpCircle, Users, Mic } from "lucide-react";
import { AMASessionStatus, UserRole } from "@prisma/client"; // Import enum if needed elsewhere
import { format } from "date-fns"; // For date formatting (npm install date-fns)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAMAStatusBadgeVariant, getInitials } from "@/lib/utils/helpers";
import { formatShortDate, formatTime } from "@/lib/utils/date-helpers";
import { getCurrentUser } from "@/lib/auth";
import { CreateSessionDialog } from "@/components/ama/create-session-dialog";
// --- Define Session Type expected from API ---
type AMASessionData = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | Date; // API might return string
  status: AMASessionStatus;
  isTechSpecific: boolean;
  topic: string | null;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    questions: number;
  };
};

const getStatusText = (status: AMASessionStatus): string => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

// --- Reusable Session Card ---
function AMASessionCard({ session }: { session: AMASessionData }) {
  return (
    <Link
      href={`app/ama/${session.id}`}
      className="block hover:shadow-lg transition-shadow duration-200 rounded-lg"
    >
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start gap-2 mb-1">
            <CardTitle className="text-lg font-semibold">
              {session.title}
            </CardTitle>
            <Badge
              variant={getAMAStatusBadgeVariant(session.status)}
              className="capitalize text-xs whitespace-nowrap"
            >
              {getStatusText(session.status)}
            </Badge>
          </div>
          {session.isTechSpecific && session.topic && (
            <Badge variant="outline" className="w-fit text-xs">
              {session.topic}
            </Badge>
          )}
          {session.description && (
            <CardDescription className="text-sm text-muted-foreground pt-1 line-clamp-2">
              {session.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow text-sm text-muted-foreground space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatShortDate(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatTime(session.scheduledAt)}</span> {/* Time */}
          </div>
          <div className="flex items-center">
            <Mic className="h-4 w-4 mr-2" /> Hosted by
            <Avatar className="h-5 w-5 ml-1.5 mr-1">
              {" "}
              <AvatarImage src={session.host.image ?? undefined} />{" "}
              <AvatarFallback className="text-xs">
                {getInitials(session.host.name)}
              </AvatarFallback>{" "}
            </Avatar>
            <span className="font-medium text-foreground/90">
              {session.host.name ?? "Host"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
          <div className="flex items-center">
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            <span>
              {session._count.questions} Question
              {session._count.questions !== 1 ? "s" : ""}
            </span>
          </div>
          {/* Optionally add created date or other info */}
        </CardFooter>
      </Card>
    </Link>
  );
}

// --- Loading Skeleton ---
function AMAListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="h-full flex flex-col">
          <CardHeader>
            {" "}
            <Skeleton className="h-6 w-3/4 mb-2" />{" "}
            <Skeleton className="h-4 w-1/3 mb-3" />{" "}
            <Skeleton className="h-4 w-full" />{" "}
            <Skeleton className="h-4 w-5/6" />{" "}
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            {" "}
            <Skeleton className="h-5 w-3/4" />{" "}
            <Skeleton className="h-5 w-1/2" />{" "}
            <Skeleton className="h-6 w-5/6" />{" "}
          </CardContent>
          <CardFooter>
            {" "}
            <Skeleton className="h-4 w-1/3" />{" "}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// --- Fetching Component for Tab Content ---
async function FetchAMAList({ status }: { status: AMASessionStatus }) {
  // In RSC, you could fetch directly: const response = await prisma.aMASession.findMany(...)
  // Or fetch from your API endpoint:
  try {
    // --- CORRECTED FETCH URL using SERVER-SIDE ENV VAR ---
    const baseUrl = process.env.INTERNAL_APP_URL; // Read the server-side variable
    if (!baseUrl) {
      // Handle case where env var is missing - essential for production
      console.error("INTERNAL_APP_URL environment variable is not set.");
      throw new Error("Application configuration error."); // Throw or return error alert
    }

    const apiUrl = `${baseUrl}/api/ama/sessions?status=${status}&limit=9`;
    console.log(`Fetching AMA sessions from: ${apiUrl}`); // Log the full URL being fetched

    const response = await fetch(apiUrl, {
      cache: "no-store",
    });
    // --- END CORRECTION ---
    if (!response.ok) {
      // Handle error appropriately - maybe throw or return error component
      console.error("Failed to fetch AMA sessions:", response.statusText);
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load sessions.</AlertDescription>
        </Alert>
      );
    }
    const result = await response.json();
    const sessions: AMASessionData[] = result.data || [];

    if (sessions.length === 0) {
      return (
        <Alert>
          <Mic className="h-4 w-4" />
          <AlertTitle>No {getStatusText(status)} Sessions</AlertTitle>
          <AlertDescription>
            There are no {status.toLowerCase()} AMA sessions scheduled right
            now.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <AMASessionCard key={session.id} session={session} />
        ))}
      </div>
    );
  } catch (error) {
    console.error(`Unexpected error fetching AMA sessions (${status}):`, error);
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An unexpected error occurred while loading sessions.
        </AlertDescription>
      </Alert>
    );
  }
}

// --- Main Page Component ---
export default async function AMAPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ask Me Anything (AMA)</h1>
        {/* Add Create Button Here later */}
        {isAdmin && <CreateSessionDialog />}
      </div>
      <p className="text-muted-foreground mb-8">
        Connect with leadership and experts. Ask questions and get insights
        during scheduled sessions.
      </p>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Suspense fallback={<AMAListSkeleton />}>
            <FetchAMAList status={AMASessionStatus.UPCOMING} />
          </Suspense>
        </TabsContent>
        <TabsContent value="live">
          <Suspense fallback={<AMAListSkeleton />}>
            <FetchAMAList status={AMASessionStatus.LIVE} />
          </Suspense>
        </TabsContent>
        <TabsContent value="past">
          <Suspense fallback={<AMAListSkeleton />}>
            <FetchAMAList status={AMASessionStatus.ENDED} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// app/ama/page.tsx
import { Suspense } from "react";
import { Tabs } from "@/components/aceternity/tabs"; // Import the custom Tabs component
import { Mic } from "lucide-react";
import { AMASessionStatus, UserRole } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";
import { CreateSessionDialog } from "@/components/ama/create-session-dialog";
import { AMAListSkeleton } from "@/components/ama/ama-list-skeleton";
import { getStatusText } from "@/lib/utils/get_status";
import { AMASessionData } from "@/types/types";
import { AMASessionCard } from "@/components/ama/ama-session-card";

// --- Fetching Component for Tab Content ---
async function FetchAMAList({ status }: { status: AMASessionStatus }) {
  try {
    const baseUrl = process.env.INTERNAL_APP_URL;
    if (!baseUrl) {
      console.error("INTERNAL_APP_URL environment variable is not set.");
      throw new Error("Application configuration error.");
    }

    const apiUrl = `${baseUrl}/api/ama/sessions?status=${status}&limit=9`;
    console.log(`Fetching AMA sessions from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
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

  // Define tab content components
  const UpcomingContent = () => (
    <Suspense fallback={<AMAListSkeleton />}>
      <FetchAMAList status={AMASessionStatus.UPCOMING} />
    </Suspense>
  );

  const LiveContent = () => (
    <Suspense fallback={<AMAListSkeleton />}>
      <FetchAMAList status={AMASessionStatus.LIVE} />
    </Suspense>
  );

  const PastContent = () => (
    <Suspense fallback={<AMAListSkeleton />}>
      <FetchAMAList status={AMASessionStatus.ENDED} />
    </Suspense>
  );

  // Define tabs for the custom Tabs component
  const tabsData = [
    {
      title: "Upcoming",
      value: "upcoming",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p className="mb-4">Upcoming tab</p>
          <UpcomingContent />
        </div>
      ),
    },
    {
      title: "Live",
      value: "live",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p className="mb-4">Live tab</p>
          <LiveContent />
        </div>
      ),
    },
    {
      title: "Past",
      value: "past",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p className="mb-4">Past tab</p>
          <PastContent />
        </div>
      ),
    },
  ];

  return (
    <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative b flex flex-col max-w-5xl mx-auto w-full  items-start justify-start my-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ask Me Anything (AMA)</h1>
        {isAdmin && <CreateSessionDialog />}
      </div>
      <p className="text-muted-foreground mb-8">
        Connect with leadership and experts. Ask questions and get insights
        during scheduled sessions.
      </p>

      {/* <div className="relative"> */}
      <Tabs
        tabs={tabsData}
        containerClassName="mb-16"
        activeTabClassName="bg-primary/10 dark:bg-primary/20"
        tabClassName="font-medium transition-all duration-200"
        contentClassName="mt-8"
      />
      {/* </div> */}
    </div>
  );
}

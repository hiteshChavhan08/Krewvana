// // components/ama-page-client.tsx (Create this new file)
// "use client"; // This component handles UI interaction and state

// import { Suspense, useEffect, useState } from "react"; // Import useState, useEffect if needed
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Mic } from "lucide-react";
// import { AMASessionStatus } from "@prisma/client";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { CreateSessionDialog } from "@/components/ama/create-session-dialog";
// import { AMASessionCard } from "@/components/ama/session-card"; // Assuming this is adjusted or doesn't need client hooks directly
// import { AnimatedContainer } from "@/components/ui/animated-container"; // Framer motion wrapper
// import { fadeIn, slideUp } from "@/lib/animations"; // Animation variants
// import React from "react"; // Import React

// // Import Skeleton and Fetching Component (which can remain async if called correctly)
// // import { AMAListSkeleton, FetchAMAList } from "@/components/"; // Adjust path if FetchAMAList is in page.tsx

// interface AmaPageClientProps {
//   isAdmin: boolean; // Receive admin status as a prop
// }
// // --- Define Session Type expected from API ---
// type AMASessionData = {
//   id: string;
//   title: string;
//   description: string | null;
//   scheduledAt: string | Date;
//   status: AMASessionStatus;
//   isTechSpecific: boolean;
//   topic: string | null;
//   host: {
//     id: string;
//     name: string | null;
//     image: string | null;
//   };
//   _count: {
//     questions: number;
//   };
// };

// // --- Loading Skeleton with immediate visibility ---
// function AMAListSkeleton() {
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//       {[...Array(3)].map((_, i) => (
//         <div key={i} className="border rounded-lg p-6 h-64 animate-pulse">
//           <div className="flex justify-between">
//             <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
//             <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
//           </div>
//           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
//           <div className="space-y-3">
//             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
//             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
//             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// // --- Fetching Component for Tab Content ---
// async function FetchAMAList({ status }: { status: AMASessionStatus }) {
//   try {
//     const baseUrl = process.env.INTERNAL_APP_URL;
//     if (!baseUrl) {
//       console.error("INTERNAL_APP_URL environment variable is not set.");
//       throw new Error("Application configuration error.");
//     }

//     const apiUrl = `${baseUrl}/api/ama/sessions?status=${status}&limit=9`;
//     console.log(`Fetching AMA sessions from: ${apiUrl}`);

//     const response = await fetch(apiUrl, {
//       cache: "no-store",
//       next: { revalidate: 0 }, // Ensure fresh data on each request
//     });

//     if (!response.ok) {
//       console.error("Failed to fetch AMA sessions:", response.statusText);
//       return (
//         <AnimatedContainer variants={fadeIn}>
//           <Alert variant="destructive">
//             <AlertTitle>Error</AlertTitle>
//             <AlertDescription>Could not load sessions.</AlertDescription>
//           </Alert>
//         </AnimatedContainer>
//       );
//     }

//     const result = await response.json();
//     const sessions: AMASessionData[] = result.data || [];

//     if (sessions.length === 0) {
//       return (
//         <AnimatedContainer variants={fadeIn}>
//           <Alert>
//             <Mic className="h-4 w-4" />
//             <AlertTitle>
//               No {status.charAt(0) + status.slice(1).toLowerCase()} Sessions
//             </AlertTitle>
//             <AlertDescription>
//               There are no {status.toLowerCase()} AMA sessions scheduled right
//               now.
//             </AlertDescription>
//           </Alert>
//         </AnimatedContainer>
//       );
//     }

//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {sessions.map((session, index) => (
//           <AMASessionCard key={session.id} session={session} index={index} />
//         ))}
//       </div>
//     );
//   } catch (error) {
//     console.error(`Unexpected error fetching AMA sessions (${status}):`, error);
//     return (
//       <AnimatedContainer variants={fadeIn}>
//         <Alert variant="destructive">
//           <AlertTitle>Error</AlertTitle>
//           <AlertDescription>
//             An unexpected error occurred while loading sessions.
//           </AlertDescription>
//         </Alert>
//       </AnimatedContainer>
//     );
//   }
// }

// export function AmaPageClient({ isAdmin }: AmaPageClientProps) {
//   // No need for client-side isAdmin fetch if passed as prop

//   return (
//     <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
//       <AnimatedContainer
//         variants={slideUp}
//         className="flex justify-between items-center mb-6"
//       >
//         <h1 className="text-3xl font-bold">Ask Me Anything (AMA)</h1>
//         {/* Show button based on prop */}
//         {isAdmin && <CreateSessionDialog />}
//       </AnimatedContainer>

//       <AnimatedContainer variants={fadeIn} delay={0.1} className="mb-8">
//         <p className="text-muted-foreground">
//           Connect with leadership and experts. Ask questions and get insights
//           during scheduled sessions.
//         </p>
//       </AnimatedContainer>

//       {/* --- Use standard Tabs --- */}
//       <Tabs defaultValue="upcoming" className="w-full">
//         <AnimatedContainer variants={fadeIn} delay={0.1} className="mb-4">
//           <TabsList className="mb-6">
//             <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
//             <TabsTrigger value="live">Live</TabsTrigger>
//             <TabsTrigger value="past">Past</TabsTrigger>
//           </TabsList>
//         </AnimatedContainer>

//         {/* --- Suspense boundary WITHIN each TabsContent --- */}
//         {/* FetchAMAList is an Async Server Component called within a Client Component tree */}
//         {/* This pattern is supported */}
//         <TabsContent value="upcoming">
//           <Suspense fallback={<AMAListSkeleton />}>
//             <FetchAMAList status={AMASessionStatus.UPCOMING} />
//           </Suspense>
//         </TabsContent>
//         <TabsContent value="live">
//           <Suspense fallback={<AMAListSkeleton />}>
//             <FetchAMAList status={AMASessionStatus.LIVE} />
//           </Suspense>
//         </TabsContent>
//         <TabsContent value="past">
//           <Suspense fallback={<AMAListSkeleton />}>
//             <FetchAMAList status={AMASessionStatus.ENDED} />
//           </Suspense>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

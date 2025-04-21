// app/mentorship/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming Shadcn components are in @/components
import { DiscoverCircles } from "@/components/discover-circles"; // We'll create this
import { MyCircles } from "@/components/my-circles";       // We'll create this
import { ProposeCircle } from "@/components/propose-circle"; // We'll create this
import { getCurrentUser } from "@/lib/auth"; // Use your auth helper
import { redirect } from "next/navigation";

export default async function MentorshipPage() {
  const user = await getCurrentUser();

  if (!user) {
    // Redirect to login if user is not authenticated
    // Adjust the login path as needed
    redirect("/api/auth/signin?callbackUrl=/mentorship");
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Reverse Mentorship Circles</h1>
      <p className="text-muted-foreground mb-8">
        Connect with colleagues to share knowledge on digital tools, tech trends, and modern work styles. Learn from peers and mentor others!
      </p>

      <Tabs defaultValue="discover" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
           <TabsList>
             <TabsTrigger value="discover">Discover Circles</TabsTrigger>
             <TabsTrigger value="my-circles">My Circles</TabsTrigger>
           </TabsList>
           {/* Button to propose a circle - will trigger a dialog */}
           <ProposeCircle />
        </div>

        <TabsContent value="discover">
          {/* This component will fetch and display available circles */}
          <DiscoverCircles />
        </TabsContent>
        <TabsContent value="my-circles">
          {/* This component will fetch and display circles the user is part of */}
          <MyCircles userId={user.id} /> {/* Pass user ID if needed */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
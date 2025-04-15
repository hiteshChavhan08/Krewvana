// --- File: app/dashboard/page.tsx ---
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back! Here's a quick overview of what's happening.
      </p>

      {/* Grid for Dashboard Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Example Widget: Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump right into common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/recognition" passHref legacyBehavior><Button variant="outline" className="w-full justify-start">Give Recognition</Button></Link>
            <Link href="/innovation" passHref legacyBehavior><Button variant="outline" className="w-full justify-start">Submit an Idea</Button></Link>
            <Link href="/learning" passHref legacyBehavior><Button variant="outline" className="w-full justify-start">Browse Courses</Button></Link>
          </CardContent>
        </Card>

        {/* Example Widget: Ongoing Challenges */}
        <Card>
          <CardHeader>
            <CardTitle>Active Challenges</CardTitle>
            <CardDescription>See what challenges you can join.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder - Fetch and list challenges here */}
            <p className="text-sm text-muted-foreground">No active challenges currently joined.</p>
            <Link href="/wellness" passHref legacyBehavior><Button variant="link" className="p-0 h-auto mt-2">View Wellness Challenges</Button></Link>
          </CardContent>
        </Card>

        {/* Example Widget: Recent Recognitions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Recognitions</CardTitle>
            <CardDescription>See who's been recognized lately.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder - Fetch and list recognitions here */}
            <p className="text-sm text-muted-foreground">No recent recognitions to show.</p>
             <Link href="/recognition" passHref legacyBehavior><Button variant="link" className="p-0 h-auto mt-2">View Recognition Feed</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
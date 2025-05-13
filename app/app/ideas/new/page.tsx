// /app/app/ideas/new/page.tsx
import React from 'react';
import { IdeaForm } from '@/components/ideas/IdeaForm'; // Adjust import path
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth'; // To check if user is logged in server-side
import { redirect } from 'next/navigation'; // To redirect if not logged in
import { ClientRedirectHandler } from "@/app/app/ideas/new/ClientRedirectHandler"; // We'll create this client component

export default async function PitchIdeaPage() {
  // Server-side check for authentication
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    // Redirect to sign-in if trying to access pitch page while logged out
    // You might want to add a callbackUrl to return here after login
    redirect('/auth/signin?callbackUrl=/app/ideas/new');
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Lightbulb className="h-12 w-12 mx-auto text-primary mb-3" />
          <CardTitle className="text-2xl font-bold">Pitch Your Brilliant Idea!</CardTitle>
          <CardDescription>
            Share your innovative thoughts with the Kanaka team. Fill out the details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* Client component to handle redirect after successful submission */}
           <ClientRedirectHandler />
        </CardContent>
      </Card>
    </div>
  );
}
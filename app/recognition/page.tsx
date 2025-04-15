// --- File: app/recognition/page.tsx ---
'use client'; // Mark as Client Component

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns'; // For relative time formatting
// Import a component for creating new recognitions (Build this next)
// import CreateRecognitionForm from '@/components/recognition/create-form';

// Interface matching the API response (including nested objects)
interface Recognition {
  id: string;
  message: string;
  createdAt: string; // Comes as ISO string
  valueTag: string | null;
  points: number | null;
  isPublic: boolean;
  giver: {
    name: string | null;
    image: string | null;
  };
  recipient: {
    name: string | null;
    image: string | null;
  };
  badge: {
      name: string | null;
      imageUrl: string | null;
  } | null;
}

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false); // State to toggle form

  const fetchRecognitions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/recognitions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRecognitions(data);
      } catch (err) {
        console.error("Failed to fetch recognitions:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchRecognitions();
  }, []); // Fetch on initial load

  // Function to add a new recognition to the top of the list after creation
  const handleRecognitionCreated = (newRecognition: Recognition) => {
    setRecognitions(prev => [newRecognition, ...prev]);
    setShowCreateForm(false); // Hide form after successful creation
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold md:text-3xl">Recognition Hub</h1>
         {/* Add button to open the create form */}
         <Button onClick={() => setShowCreateForm(true)}>Give Recognition</Button>
      </div>
      <p className="text-muted-foreground">
        Celebrate successes and appreciate your colleagues.
      </p>

      {/* Conditionally render the Create Recognition Form (Component needed) */}
      {/* {showCreateForm && (
          <CreateRecognitionForm
              onSuccess={handleRecognitionCreated}
              onCancel={() => setShowCreateForm(false)}
          />
      )} */}
       {showCreateForm && (
            <Card>
                <CardHeader>
                    <CardTitle>Give Recognition</CardTitle>
                    <CardDescription>Fill in the details below. (Form UI needed)</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-muted-foreground'>[Recognition Form Placeholder]</p>
                    <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)} className='mt-4'>Cancel</Button>
                     {/* Add Submit button linked to POST /api/recognitions */}
                </CardContent>
            </Card>
       )}


      {error && <p className="text-red-500">Error loading recognitions: {error}</p>}

      {/* Recognition Feed */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loaders for the feed
          <>
            <Skeleton className="h-[120px] w-full rounded-lg" />
            <Skeleton className="h-[120px] w-full rounded-lg" />
            <Skeleton className="h-[120px] w-full rounded-lg" />
          </>
        ) : recognitions.length > 0 ? (
          recognitions.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="p-4 flex gap-4 items-start">
                 {/* Giver Avatar */}
                <Avatar className="h-10 w-10 border">
                   <AvatarImage src={rec.giver.image ?? undefined} alt={rec.giver.name ?? 'User'} />
                   <AvatarFallback>{rec.giver.name?.substring(0, 2).toUpperCase() ?? ' G'}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">
                    {rec.giver.name ?? 'Someone'} recognized {rec.recipient.name ?? 'someone'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {/* Format date nicely */}
                    {formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true })}
                  </p>
                  <p className="mt-2 text-base">{rec.message}</p>
                  {/* Optional: Display value tag, points, badge */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {rec.valueTag && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{rec.valueTag}</span>}
                    {rec.points && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">+{rec.points} points</span>}
                    {rec.badge?.name && (
                        <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            {rec.badge.imageUrl && <img src={rec.badge.imageUrl} alt={rec.badge.name} className="h-3 w-3 rounded-full"/>}
                            {rec.badge.name}
                        </span>
                    )}
                  </div>
                </div>
                 {/* Recipient Avatar (Optional) */}
                 <Avatar className="h-10 w-10 border hidden sm:flex">
                   <AvatarImage src={rec.recipient.image ?? undefined} alt={rec.recipient.name ?? 'User'} />
                   <AvatarFallback>{rec.recipient.name?.substring(0, 2).toUpperCase() ?? ' R'}</AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">No recognitions yet. Be the first to give one!</p>
        )}
      </div>
    </div>
  );
}
// app/app/shoutouts/page.tsx
'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Use Select for type
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ShoutoutCreateSchema, ShoutoutCreateData } from '@/lib/schemas';
import { ShoutoutType } from '@prisma/client'; // Import enum for select options
import { MessageSquareQuote, Terminal, Info, Send, PartyPopper } from 'lucide-react'; // Icons
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // For displaying users
import Image from 'next/image'; // For displaying shoutout image
import { ZodError } from 'zod';

// --- Type Definition (align with API response) ---
type Shoutout = {
  id: string;
  type: ShoutoutType;
  message: string;
  imageUrl?: string | null;
  createdAt: string;
  submittedBy: { id: string; name: string | null; image: string | null; };
  relatedUser?: { id: string; name: string | null; image: string | null; } | null;
};

// --- API Fetch/Mutate Functions ---
async function fetchShoutouts(): Promise<Shoutout[]> {
  const res = await fetch('/api/shoutouts');
  if (!res.ok) throw new Error('Failed to fetch shoutouts');
  return res.json();
}
async function submitShoutout(data: ShoutoutCreateData): Promise<Shoutout> {
  const res = await fetch('/api/shoutouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.details?.[0]?.message || errorData.error || 'Failed to submit');
  }
  return res.json();
}

// Helper function for initials (same as in UserNav/KudosCard)
function getInitials(name?: string | null): string {
    if (!name) return "?";
    const names = name.split(" ");
    if (names.length === 1) return names[0].substring(0, 1).toUpperCase();
    return (
      names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
    ).toUpperCase();
  }
// Helper to format enum keys to readable strings
function formatShoutoutType(type: ShoutoutType): string {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}


export default function ShoutoutsPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ShoutoutType | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [relatedUserId, setRelatedUserId] = useState(''); // TODO: Replace with UserSearchCommand later

  const { data: shoutouts, isLoading, isError, error } = useQuery<Shoutout[]>({
    queryKey: ['shoutouts'],
    queryFn: fetchShoutouts,
  });

  const mutation = useMutation({
    mutationFn: submitShoutout,
    onSuccess: (newShoutout) => {
      toast.success('Shoutout Posted!', { description: `Highlight for ${formatShoutoutType(newShoutout.type)} added.` });
      queryClient.invalidateQueries({ queryKey: ['shoutouts'] });
      // Reset form
      setType(undefined); setMessage(''); setImageUrl(''); setRelatedUserId('');
    },
    onError: (error: Error) => {
      toast.error('Post Failed', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure type is selected before parsing/submitting
    if (!type) {
        toast.warning('Please select a shoutout type.');
        return;
    }
    try {
        const dataToSubmit = ShoutoutCreateSchema.parse({ type, message, imageUrl, relatedUserId });
        mutation.mutate(dataToSubmit);
    } catch (err: any) {
      if (err instanceof ZodError) {
        toast.error('Validation Error', { description: err.errors[0].message });
      } else {
        toast.error('Validation Error', { description: 'Invalid data provided.' });
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
         <PartyPopper className="h-8 w-8 text-pink-500" /> Team Moments & Shoutouts
      </h1>

      {/* --- Submission Form Card --- */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Share a Highlight</CardTitle>
          <CardDescription>Celebrate wins, milestones, or great work!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sh-type">Type*</Label>
               <Select value={type} onValueChange={(value) => setType(value as ShoutoutType)}>
                  <SelectTrigger id="sh-type">
                    <SelectValue placeholder="Select the type of shoutout..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ShoutoutType).map((enumValue) => (
                      <SelectItem key={enumValue} value={enumValue}>
                        {formatShoutoutType(enumValue)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="sh-message">Message*</Label>
              <Textarea id="sh-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share the details..." required className="min-h-[100px]" />
            </div>
             <div>
              <Label htmlFor="sh-image">Image URL (Optional)</Label>
              <Input id="sh-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
            </div>
            <div>
              <Label htmlFor="sh-related-user">Tag a User (Optional)</Label>
              {/* TODO: Replace with UserSearchCommand */}
              <Input id="sh-related-user" value={relatedUserId} onChange={(e) => setRelatedUserId(e.target.value)} placeholder="Enter User ID to tag (e.g., for anniversary)" />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Posting...' : 'Post Shoutout'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- Shoutout Feed --- */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Recent Moments</h2>
        {isLoading && <Skeleton className="h-40 w-full rounded-lg" />}
        {isError && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error?.message}</AlertDescription></Alert>}
        {!isLoading && !isError && shoutouts?.length === 0 && <Alert><Info className="h-4 w-4" /><AlertTitle>No Shoutouts Yet</AlertTitle><AlertDescription>Be the first to share a moment!</AlertDescription></Alert>}

        {!isLoading && !isError && shoutouts?.map(shoutout => (
          <Card key={shoutout.id} className="overflow-hidden">
             <CardHeader className="p-4 bg-muted/20">
                <div className="flex items-center justify-between text-sm">
                   <span className="font-semibold">{formatShoutoutType(shoutout.type)}</span>
                   <span className="text-muted-foreground">{formatDistanceToNow(new Date(shoutout.createdAt), { addSuffix: true })}</span>
                 </div>
             </CardHeader>
            <CardContent className="p-4 space-y-3">
              {shoutout.imageUrl && (
                <div className="relative aspect-video rounded-md overflow-hidden border">
                    <Image src={shoutout.imageUrl} alt="Shoutout image" layout="fill" objectFit="cover" />
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm">{shoutout.message}</p>
            </CardContent>
             <CardFooter className="p-4 border-t text-xs text-muted-foreground flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                    <span>Posted by:</span>
                     <Avatar className="h-5 w-5">
                        <AvatarImage src={shoutout.submittedBy.image ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(shoutout.submittedBy.name)}</AvatarFallback>
                    </Avatar>
                    <span>{shoutout.submittedBy.name || 'User'}</span>
                 </div>
                {shoutout.relatedUser && (
                     <div className="flex items-center gap-1.5">
                        <span>Mentioned:</span>
                         <Avatar className="h-5 w-5">
                            <AvatarImage src={shoutout.relatedUser.image ?? undefined} />
                            <AvatarFallback className="text-xs">{getInitials(shoutout.relatedUser.name)}</AvatarFallback>
                        </Avatar>
                        <span>{shoutout.relatedUser.name || 'User'}</span>
                     </div>
                 )}
             </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
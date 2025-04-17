// app/app/learning/page.tsx
'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Ensure Textarea is added
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { LearningResourceCreateSchema, LearningResourceCreateData } from '@/lib/schemas'; // Import schema
import { Lightbulb, Link as LinkIcon, Terminal, Info } from 'lucide-react'; // Icons
import Link from 'next/link'; // Next.js link for external URLs
import { formatDistanceToNow } from 'date-fns';
import { ZodError } from 'zod';

// --- API Fetch/Mutate Functions ---
async function fetchLearningResources(): Promise<any[]> {
    const res = await fetch('/api/learning/resources');
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
}
async function submitLearningResource(data: LearningResourceCreateData): Promise<any> {
    const res = await fetch('/api/learning/resources', {
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

export default function LearningPage() {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');

    const { data: resources, isLoading, isError, error } = useQuery({
        queryKey: ['learningResources'],
        queryFn: fetchLearningResources,
    });

    const mutation = useMutation({
        mutationFn: submitLearningResource,
        onSuccess: () => {
            toast.success('Resource Submitted!', { description: 'Thanks for sharing!' });
            queryClient.invalidateQueries({ queryKey: ['learningResources'] });
            // Reset form
            setTitle(''); setUrl(''); setDescription('');
        },
        onError: (error: Error) => {
            toast.error('Submission Failed', { description: error.message });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
             const dataToSubmit = LearningResourceCreateSchema.parse({ title, url, description });
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
                 <Lightbulb className="h-8 w-8 text-yellow-400" /> Learning Hub
             </h1>

            {/* --- Submission Form Card --- */}
             <Card className="max-w-2xl mx-auto">
                 <CardHeader>
                     <CardTitle>Share a Learning Resource</CardTitle>
                     <CardDescription>Found something useful? Share it with the team!</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                             <Label htmlFor="lr-title">Title</Label>
                             <Input id="lr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Intro to React Hooks" required />
                         </div>
                         <div>
                             <Label htmlFor="lr-url">URL</Label>
                             <Input id="lr-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/resource" required />
                         </div>
                         <div>
                             <Label htmlFor="lr-desc">Description (Optional)</Label>
                             <Textarea id="lr-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe why it's useful..." />
                         </div>
                         <Button type="submit" disabled={mutation.isPending}>
                             {mutation.isPending ? 'Submitting...' : 'Submit Resource'}
                         </Button>
                     </form>
                 </CardContent>
             </Card>

             {/* --- Resource List --- */}
             <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Shared Resources</h2>
                {isLoading && <Skeleton className="h-20 w-full rounded-lg" />}
                {isError && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error?.message}</AlertDescription></Alert>}
                {!isLoading && !isError && resources?.length === 0 && <Alert><Info className="h-4 w-4" /><AlertTitle>No Resources Yet</AlertTitle><AlertDescription>Be the first to share something!</AlertDescription></Alert>}
                {!isLoading && !isError && resources?.map(res => (
                    <Card key={res.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">
                                <Link href={res.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                                    {res.title} <LinkIcon className="h-4 w-4 text-muted-foreground inline-block"/>
                                </Link>
                            </CardTitle>
                            {res.description && <CardDescription>{res.description}</CardDescription>}
                        </CardHeader>
                        <CardFooter className="text-xs text-muted-foreground pt-2">
                             Submitted by {res.submittedBy?.name || 'User'} {formatDistanceToNow(new Date(res.submittedAt), { addSuffix: true })}
                        </CardFooter>
                    </Card>
                ))}
             </div>
        </div>
    );
}
// app/app/innovation/page.tsx
'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { InnovationIdeaCreateSchema, InnovationIdeaCreateData } from '@/lib/schemas'; // Import schema
import { Rocket, Terminal, Info } from 'lucide-react'; // Icons
import { formatDistanceToNow } from 'date-fns';
import { ZodError } from 'zod';

// --- API Fetch/Mutate Functions ---
async function fetchInnovationIdeas(): Promise<any[]> {
    const res = await fetch('/api/innovation/ideas');
    if (!res.ok) throw new Error('Failed to fetch ideas');
    return res.json();
}
async function submitInnovationIdea(data: InnovationIdeaCreateData): Promise<any> {
    const res = await fetch('/api/innovation/ideas', {
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

export default function InnovationPage() {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const { data: ideas, isLoading, isError, error } = useQuery({
        queryKey: ['innovationIdeas'],
        queryFn: fetchInnovationIdeas,
    });

    const mutation = useMutation({
        mutationFn: submitInnovationIdea,
        onSuccess: () => {
            toast.success('Idea Submitted!', { description: 'Thanks for your contribution!' });
            queryClient.invalidateQueries({ queryKey: ['innovationIdeas'] });
            setTitle(''); setDescription(''); // Reset form
        },
        onError: (error: Error) => {
            toast.error('Submission Failed', { description: error.message });
        },
    });

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
         try {
             const dataToSubmit = InnovationIdeaCreateSchema.parse({ title, description });
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
                 <Rocket className="h-8 w-8 text-purple-500" /> Innovation Hub
             </h1>

            {/* --- Submission Form Card --- */}
             <Card className="max-w-2xl mx-auto">
                 <CardHeader>
                     <CardTitle>Share Your Idea</CardTitle>
                     <CardDescription>Have an idea to improve things? Let us know!</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                             <Label htmlFor="idea-title">Idea Title</Label>
                             <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A catchy title for your idea" required />
                         </div>
                         <div>
                             <Label htmlFor="idea-desc">Description</Label>
                             <Textarea id="idea-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your idea in detail..." className="min-h-[150px]" required />
                         </div>
                         <Button type="submit" disabled={mutation.isPending}>
                             {mutation.isPending ? 'Submitting...' : 'Submit Idea'}
                         </Button>
                     </form>
                 </CardContent>
             </Card>

            {/* --- Idea List --- */}
             <div className="max-w-3xl mx-auto space-y-4">
                 <h2 className="text-xl font-semibold border-b pb-2">Submitted Ideas</h2>
                 {isLoading && <Skeleton className="h-20 w-full rounded-lg" />}
                 {isError && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error?.message}</AlertDescription></Alert>}
                 {!isLoading && !isError && ideas?.length === 0 && <Alert><Info className="h-4 w-4" /><AlertTitle>No Ideas Yet</AlertTitle><AlertDescription>Share the first groundbreaking idea!</AlertDescription></Alert>}
                 {!isLoading && !isError && ideas?.map(idea => (
                     <Card key={idea.id}>
                         <CardHeader className="pb-2">
                             <CardTitle className="text-lg">{idea.title}</CardTitle>
                             <CardDescription className="pt-1 whitespace-pre-wrap">{idea.description}</CardDescription>
                         </CardHeader>
                         <CardFooter className="text-xs text-muted-foreground pt-2">
                             Submitted by {idea.submittedBy?.name || 'User'} {formatDistanceToNow(new Date(idea.submittedAt), { addSuffix: true })}
                         </CardFooter>
                     </Card>
                 ))}
            </div>
        </div>
    );
}
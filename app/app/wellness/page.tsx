// app/app/wellness/page.tsx
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HeartPulse, Link as LinkIcon, Terminal } from 'lucide-react'; // Icons
import Link from 'next/link';

// --- API Fetch Function ---
async function fetchWellnessResources(): Promise<any[]> {
    const res = await fetch('/api/wellness/resources');
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
}

export default function WellnessPage() {
    const { data: resources, isLoading, isError, error } = useQuery({
        queryKey: ['wellnessResources'],
        queryFn: fetchWellnessResources,
    });

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
                 <HeartPulse className="h-8 w-8 text-red-500" /> Wellness Corner
             </h1>

             <p className="text-center text-muted-foreground max-w-2xl mx-auto">
                 Find resources and tools to support your mental and physical well-being. Remember to prioritize your health!
             </p>

             {/* --- Resource List --- */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
                {isError && (
                     <div className="col-span-full"> {/* Span full width for error */}
                         <Alert variant="destructive">
                             <Terminal className="h-4 w-4" />
                             <AlertTitle>Error</AlertTitle>
                             <AlertDescription>{error?.message}</AlertDescription>
                         </Alert>
                     </div>
                )}
                {!isLoading && !isError && resources?.map(res => (
                    <Card key={res.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{res.title}</CardTitle>
                            {res.description && <CardDescription className="pt-1">{res.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end">
                             <Link href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                                 Visit Resource <LinkIcon className="h-3 w-3"/>
                             </Link>
                         </CardContent>
                    </Card>
                ))}
             </div>
        </div>
    );
}
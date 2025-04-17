// app/admin/learning/courses/edit/[courseId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";

import { CourseForm } from "@/components/admin/learning/course-form"; // Adjust path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Re-import type if needed, or from shared types file
type CourseFormValues = {
    title: string;
    description?: string | null;
    source?: string | null;
    url?: string | null;
    imageUrl?: string | null;
    difficulty?: string | null;
    tags?: string; // Comma-separated string from form
};

// Type matching the GET /api/courses/[courseId] response (or a specific Course type)
type CourseData = {
    id: string;
    title: string;
    description: string | null;
    source: string | null;
    url: string | null;
    imageUrl: string | null;
    difficulty: string | null;
    tags: string[];
    // Add other fields returned by API if needed
};


export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const { data: session, status: sessionStatus } = useSession();

    const courseId = params?.courseId as string | undefined; // Get ID from route params

    const [initialData, setInitialData] = useState<CourseData | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // --- Fetch Initial Data ---
    const fetchCourseData = useCallback(async () => {
        if (!courseId) {
            setFetchError("Course ID not found in URL.");
            setIsLoadingData(false);
            return;
        }
        setIsLoadingData(true);
        setFetchError(null);
        try {
            const response = await fetch(`/api/courses/${courseId}`);
            if (response.status === 404) throw new Error("Course not found.");
            if (!response.ok) throw new Error(`Failed to fetch course data (status ${response.status})`);
            const data: CourseData = await response.json();
            setInitialData(data);
        } catch (error) {
            console.error("Fetch course data error:", error);
            setFetchError(error instanceof Error ? error.message : "Failed to load course data.");
            setInitialData(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [courseId]);

    useEffect(() => {
        // Fetch only if authenticated and authorized (can also check role here)
         if (sessionStatus === 'authenticated' && courseId) {
             if(session?.user?.role !== Role.ADMIN) {
                setFetchError("Access Denied: You cannot edit courses.");
                setIsLoadingData(false);
             } else {
                fetchCourseData();
             }
         } else if (sessionStatus === 'unauthenticated') {
             setFetchError("Unauthorized. Please log in.");
             setIsLoadingData(false);
         }
    }, [courseId, fetchCourseData, sessionStatus, session?.user?.role]);
    // --- End Fetch Initial Data ---

    // --- Authorization Check ---
    if (sessionStatus === "loading") {
        return ( <div className="container py-8 space-y-4"> <Skeleton className="h-8 w-48" /> <Skeleton className="h-96 w-full" /> </div> );
    }
    if (sessionStatus === "unauthenticated" || session?.user?.role !== Role.ADMIN) {
         return (
             <div className="container py-12 flex justify-center">
                <Alert variant="destructive" className="max-w-md">
                     <Terminal className="h-4 w-4" />
                     <AlertTitle>Access Denied</AlertTitle>
                     <AlertDescription>You do not have permission to edit courses.</AlertDescription>
                     <Button variant="link" asChild className="mt-2 p-0 h-auto"><Link href="/learning/courses">Back to Learning Hub</Link></Button>
                 </Alert>
            </div>
         );
    }
    // --- End Authorization Check ---


    const handleEditCourse = async (values: CourseFormValues): Promise<boolean> => {
        if (!courseId) return false; // Should not happen if page rendered
        setIsSubmitting(true);
        try {
            // Prepare data for API (parse tags, handle nulls)
            const apiData = {
                ...values,
                 url: values.url || null,
                 imageUrl: values.imageUrl || null,
                 tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            };

            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT', // Or PATCH if your API supports it
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update course (status ${response.status})`);
            }

            const updatedCourse = await response.json();
            toast.success(`Course "${updatedCourse.title}" updated successfully!`);
            router.push('/learning/courses'); // Redirect after update
            // router.refresh(); // Optional
            return true; // Indicate success

        } catch (error) {
            console.error("Update course error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update course.");
            setIsSubmitting(false); // Keep form enabled on error
            return false; // Indicate failure
        }
    };

    // --- Render Logic ---
    if (isLoadingData) {
         return ( <div className="container py-8 space-y-4 max-w-3xl mx-auto"> <Skeleton className="h-12 w-1/2" /> <Skeleton className="h-[600px] w-full" /> </div> );
    }

    if (fetchError) {
         return (
             <div className="container py-12 flex justify-center">
                <Alert variant="destructive" className="max-w-md">
                     <WifiOff className="h-4 w-4" />
                     <AlertTitle>Error Loading Course Data</AlertTitle>
                     <AlertDescription>{fetchError}</AlertDescription>
                      <Button variant="link" asChild className="mt-2 p-0 h-auto"><Link href="/learning/courses">Back to Learning Hub</Link></Button>
                 </Alert>
            </div>
         );
    }

    if (!initialData) {
         // Should be caught by fetchError, but as a fallback
          return ( <div className="container py-8">Could not load course data.</div> );
    }

    return (
        <div className="container py-8 max-w-3xl mx-auto">
            <CourseForm
                initialData={initialData} // Pass fetched data
                onSubmit={handleEditCourse}
                // isSubmitting={isSubmitting}
                mode="edit"
            />
        </div>
    );
}
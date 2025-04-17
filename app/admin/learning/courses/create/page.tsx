// app/admin/learning/courses/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";

import { CourseForm } from "@/components/admin/learning/course-form"; // Adjust path if needed
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

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

export default function CreateCoursePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Authorization Check ---
    if (status === "loading") {
        return (
            <div className="container py-8 space-y-4">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-96 w-full" />
            </div>
        ); // Or a more specific loading state
    }

    if (status === "unauthenticated" || session?.user?.role !== Role.ADMIN) {
        // Redirect or show forbidden message
        // Option 1: Redirect (uncomment if preferred)
        // useEffect(() => { router.push('/unauthorized'); }, [router]);
        // return null;

        // Option 2: Show message
         return (
             <div className="container py-12 flex justify-center">
                <Alert variant="destructive" className="max-w-md">
                     <Terminal className="h-4 w-4" />
                     <AlertTitle>Access Denied</AlertTitle>
                     <AlertDescription>You do not have permission to create courses.</AlertDescription>
                 </Alert>
            </div>
         );
    }
    // --- End Authorization Check ---


    const handleCreateCourse = async (values: CourseFormValues): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            // Prepare data for API (parse tags)
            const apiData = {
                ...values,
                url: values.url || null, // Ensure empty strings become null
                imageUrl: values.imageUrl || null,
                tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            };

            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to create course (status ${response.status})`);
            }

            const newCourse = await response.json();
            toast.success(`Course "${newCourse.title}" created successfully!`);
            router.push('/learning/'); // Redirect to course list or detail page
            // router.refresh(); // Optional: force refresh if needed
            return true; // Indicate success

        } catch (error) {
            console.error("Create course error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create course.");
            setIsSubmitting(false); // Keep form enabled on error
            return false; // Indicate failure
        }
        // setIsSubmitting(false) is handled in the finally block implicitly if redirecting
    };

    return (
        <div className="container py-8 max-w-3xl mx-auto">
            <CourseForm
                onSubmit={handleCreateCourse}
                // isSubmitting={isSubmitting}
                mode="create"
                // No initialData for create mode
            />
        </div>
    );
}
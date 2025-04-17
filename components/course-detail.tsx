// components/course-details.tsx shown on indivaidual course
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Removing Tabs for simplicity unless needed
import { BookOpen, Calendar, CheckCircle, Clock, Download, ExternalLink, Play, Star, Users, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns"; // For relative dates

// Import types
import type { CourseDetails, CourseEnrollmentStatus } from "@/types/learning"; // Adjust path
import { faker } from "@faker-js/faker";

export function CourseDetail({ courseId }: { courseId: string }) {
    const { data: session, status: sessionStatus } = useSession();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [enrollment, setEnrollment] = useState<CourseEnrollmentStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    // Add state for updating progress if implementing module completion later
    // const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

    // --- Data Fetching ---
    const fetchCourseAndEnrollmentData = useCallback(async () => {
        if (!courseId) {
            setError("No course ID provided.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setEnrollment(null); // Reset enrollment status on refetch

        try {
            // Fetch course details first
            const courseRes = await fetch(`/api/courses/${courseId}`);
            if (courseRes.status === 404) throw new Error("Course not found.");
            if (!courseRes.ok) throw new Error(`Failed to fetch course details (status ${courseRes.status})`);
            const courseData: CourseDetails = await courseRes.json();
            setCourse(courseData);

            // If logged in, fetch enrollment status for *this* course
            if (sessionStatus === 'authenticated') {
                // Option 1: Fetch only this enrollment (needs API adjustment)
                // const enrollRes = await fetch(`/api/enrollments/me?courseId=${courseId}`);

                // Option 2: Fetch all enrollments and filter (less efficient for many enrollments)
                 const enrollRes = await fetch(`/api/enrollments/me`);
                 if (enrollRes.ok) {
                     const allEnrollmentsData = await enrollRes.json();
                     const currentEnrollment = allEnrollmentsData?.data?.find(
                         (enr: { course: { id: string } }) => enr.course?.id === courseId
                     );
                     if (currentEnrollment) {
                         setEnrollment(currentEnrollment);
                     }
                 } else if (enrollRes.status !== 401) { // Ignore 401, just means not logged in
                      console.warn(`Could not fetch enrollment status (status ${enrollRes.status})`);
                 }
            }

        } catch (err) {
            console.error("Fetch Course/Enrollment Error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setCourse(null); // Clear data on error
        } finally {
            setIsLoading(false);
        }
    }, [courseId, sessionStatus]); // Depend on courseId and auth status

    useEffect(() => {
        fetchCourseAndEnrollmentData();
    }, [fetchCourseAndEnrollmentData]); // Fetch when component mounts or dependencies change

    // --- Actions ---
    const handleEnroll = async () => {
        if (!session?.user) {
            toast.error("Please log in to enroll.");
            // Optionally redirect to login: router.push('/login?callbackUrl=/learning/courses/' + courseId)
            return;
        }
        setIsEnrolling(true);
        try {
            const response = await fetch("/api/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify({ courseId: courseId }), // Send courseId
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Enrollment failed (status ${response.status})`);
            }

            const newEnrollment: CourseEnrollmentStatus = await response.json();
            setEnrollment(newEnrollment); // Update state with new enrollment
            toast.success(`Successfully enrolled in "${course?.title}"!`);

        } catch (err) {
            console.error("Enrollment Error:", err);
            toast.error(err instanceof Error ? err.message : "Failed to enroll.");
        } finally {
            setIsEnrolling(false);
        }
    };

    // Placeholder for module completion - requires more complex API/logic
    // const handleModuleComplete = async (moduleId: string) => { /* ... */ };

    // --- Render Logic ---

    if (isLoading) {
        return <CourseDetailSkeleton />; // Show skeleton while loading
    }

    if (error) {
        return (
            <div className="container py-12 flex justify-center">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Course</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                     <Button variant="link" asChild className="mt-2 p-0 h-auto"><Link href="/learning/courses">Back to Courses</Link></Button>
                </Alert>
            </div>
        );
    }

    if (!course) {
         return ( <div className="container py-8 text-center">Course data could not be loaded.</div> ); // Fallback
    }

    // Calculate dynamic details (handle nulls)
    const courseDuration = course.tags?.length ? `${course.tags.length} modules` : (course.difficulty ? `~${faker.number.int({min: 2, max: 8})} hours` : null); // Example placeholder duration
    const enrolledCount = course._count?.enrollments ?? faker.number.int({min: 20, max: 300}); // Use count or faker placeholder


    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6 mb-6">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
                        <p className="mt-2 text-muted-foreground max-w-prose">{course.description ?? "No description available."}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {course.tags.map(tag => ( <Badge key={tag} variant="secondary">{tag}</Badge> ))}
                             {course.difficulty && <Badge variant="outline">{course.difficulty}</Badge>}
                             {course.source && <Badge variant="outline">Source: {course.source}</Badge>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 md:text-right flex-shrink-0 w-full md:w-auto">
                        {!enrollment ? (
                            <Button size="lg" onClick={handleEnroll} disabled={isEnrolling || sessionStatus === 'unauthenticated'}>
                                {isEnrolling ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Enrolling...</>) : sessionStatus === 'unauthenticated' ? "Log in to Enroll" : "Enroll Now"}
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-medium">{enrollment.progress}% Complete</span>
                                </div>
                                <Progress value={enrollment.progress} className="h-2 w-full md:w-[200px]" />
                                {/* Link to actual course content page or external URL */}
                                <Button size="lg" asChild>
                                     <Link href={course.url || `/learning/courses/${course.id}/learn`}> {/* Use external URL or internal path */}
                                         Continue Learning
                                     </Link>
                                </Button>
                            </div>
                        )}
                         {sessionStatus === 'authenticated' && enrollment && (
                            <p className="text-xs text-muted-foreground text-right">
                                {enrollment.status === 'Completed' && enrollment.completedAt
                                    ? `Completed ${format(new Date(enrollment.completedAt), 'PP')}`
                                    : `Status: ${enrollment.status}`}
                            </p>
                         )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Course Content Area (Left/Main Column) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Remove static module list - replace with dynamic content if API provides it */}
                        <Card>
                           <CardHeader><CardTitle>About This Course</CardTitle></CardHeader>
                           <CardContent>
                               <p className="text-sm text-muted-foreground">
                                   {/* Could add more detailed description or learning outcomes here if available */}
                                   Further details about the course structure and what you will learn will appear here.
                                   {course.url && (
                                        <Button variant="link" asChild className="p-0 h-auto ml-1">
                                            <a href={course.url} target="_blank" rel="noopener noreferrer">
                                                Visit external course page <ExternalLink className="inline-block h-3 w-3 ml-1"/>
                                            </a>
                                        </Button>
                                   )}
                                </p>
                           </CardContent>
                        </Card>
                         {/* Optionally add a section for user reviews/comments if implementing */}
                         {/* <Card><CardHeader><CardTitle>Reviews</CardTitle></CardHeader><CardContent>...</CardContent></Card> */}
                    </div>

                    {/* Details & Instructor Area (Right Column) */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {course.difficulty && (<div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Level</span><span className="font-medium">{course.difficulty}</span></div>)}
                                {courseDuration && (<div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Est. Duration</span><span className="font-medium">{courseDuration}</span></div>)}
                                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Enrolled</span><span className="font-medium">{enrolledCount} learners</span></div>
                                {course.createdAt && (<div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Added</span><span className="font-medium">{formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })}</span></div>)}
                                {/* Add Rating if available */}
                            </CardContent>
                        </Card>

                        {/* Remove static Instructor Card - replace if API provides instructor data */}
                        {/* <Card> ... Instructor Card ... </Card> */}

                        {/* Remove static Resources Card - replace if API provides resources */}
                         {/* <Card> ... Resources Card ... </Card> */}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}


// --- Skeleton Component ---
function CourseDetailSkeleton() {
    return (
         <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
             <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6 mb-6">
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Skeleton className="h-6 w-20 rounded-full"/>
                        <Skeleton className="h-6 w-24 rounded-full"/>
                         <Skeleton className="h-6 w-16 rounded-full"/>
                    </div>
                </div>
                 <div className="flex flex-col gap-2 md:text-right flex-shrink-0 w-full md:w-auto">
                     <Skeleton className="h-12 w-32 ml-auto" />
                     <Skeleton className="h-2 w-48 ml-auto" />
                </div>
             </div>
             <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                     <Skeleton className="h-48 w-full" />
                     <Skeleton className="h-32 w-full" />
                </div>
                 <div className="space-y-4">
                     <Skeleton className="h-40 w-full" />
                     <Skeleton className="h-32 w-full" />
                </div>
             </div>
         </div>
    );
}
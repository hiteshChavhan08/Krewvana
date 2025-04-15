// --- File: app/learning/page.tsx ---
'use client'; // Mark this as a Client Component

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

// Define an interface for the Course data structure based on Prisma schema
interface Course {
  id: string;
  title: string;
  description: string | null;
  source: string | null;
  imageUrl: string | null;
  difficulty: string | null;
  tags: string[];
}

export default function LearningPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Learning Hub</h1>
      <p className="text-muted-foreground">
        Expand your skills and knowledge. Find courses below.
      </p>

      {/* Add Filters/Search Bar here later */}

      {error && <p className="text-red-500">Error loading courses: {error}</p>}

      {/* Grid for Learning Sections/Courses */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </>
        ) : courses.length > 0 ? (
          // Display fetched courses
          courses.map((course) => (
            <Card key={course.id}>
              {/* You might want an AspectRatio wrapper for consistent image sizes */}
              {course.imageUrl && (
                 <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="aspect-[16/9] w-full rounded-md object-cover mb-4"
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/600x400/eee/ccc?text=Image+Not+Found`; e.currentTarget.alt = 'Image Not Found'; }} // Basic fallback
                  />
              )}
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description?.substring(0, 100)}...</CardDescription>
                 {/* Display tags or difficulty */}
                 <div className="mt-2 flex flex-wrap gap-1">
                    {course.difficulty && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{course.difficulty}</span>}
                    {course.tags?.map(tag => <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{tag}</span>)}
                 </div>
              </CardHeader>
              <CardContent>
                 {/* Link to a detailed course page later */}
                 <Link href={`/learning/courses/${course.id}`} passHref legacyBehavior>
                    <Button variant="outline" size="sm">View Details</Button>
                 </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          // Show message if no courses are found
          <p className="col-span-full text-muted-foreground">No courses available at the moment.</p>
        )}

        {/* Static links to other learning sections */}
         <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle>Workshops & Webinars</CardTitle>
            <CardDescription>Join live learning sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary">View Schedule</Button>
          </CardContent>
        </Card>
         <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle>Mentorship Program</CardTitle>
            <CardDescription>Connect with mentors or mentees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary">Find a Mentor</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
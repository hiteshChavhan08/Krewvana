// app/learning/courses/[courseId]/page.tsx
import { CourseDetail } from "@/components/course-detail"; // Adjust import path as needed
import { Suspense } from "react"; // Import Suspense for cleaner loading states potentially

// Define props for the page component, including route parameters
interface CoursePageProps {
  params: {
    courseId: string; // The dynamic segment from the folder name [courseId]
  };
  // searchParams?: { [key: string]: string | string[] | undefined }; // If you need search params
}

// Optional: Generate Metadata dynamically
// export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
//   const courseId = params.courseId;
//   // Fetch minimal course data needed for metadata (e.g., title)
//   try {
//     const res = await fetch(`${process.env.NEXTAUTH_URL}/api/courses/${courseId}`); // Use absolute URL for server-side fetch
//     if (!res.ok) {
//       return { title: "Course Not Found" };
//     }
//     const course = await res.json();
//     return {
//       title: `${course?.title || 'Course'} | Kanaka Learning Hub`,
//       description: course?.description || 'View course details on the Kanaka Learning Hub.',
//     };
//   } catch (error) {
//     console.error("Metadata fetch error:", error);
//     return { title: "Course Details | Kanaka Learning Hub" };
//   }
// }


// The Page Component itself
export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { courseId } =  params;
  console.log("Course ID from params:", courseId);
  // Validate courseId basic format if needed (though API handles specific CUID check)
  if (!courseId || typeof courseId !== 'string') {
     // Handle invalid ID scenario, maybe redirect or show an error component
     return <div className="container py-8 text-center text-destructive">Invalid Course ID provided.</div>;
  }

  return (
    // You can wrap CourseDetail in Suspense if it fetches data internally
    // using React Suspense features, but since it uses useEffect, this isn't strictly necessary here.
    // <Suspense fallback={<CourseDetailSkeleton />}>
         <CourseDetail courseId={courseId} />
    // </Suspense>

    // You could also add page-level layout structure here if needed,
    // e.g., breadcrumbs specific to the course page.
  );
}

// You might still want the Skeleton defined here or imported
// function CourseDetailSkeleton() { ... skeleton JSX ... }
// It's better to keep the Skeleton component alongside or imported by CourseDetail itself.
// components/learning-hub.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  Users,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client"; // Ensure Role enum is imported or available globally
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  // DropdownMenuCheckboxItem, // Use if implementing multi-select tags filter
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar import

// --- Type Definitions ---
// (Ideally move these to a dedicated types file, e.g., types/learning.ts)
export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  difficulty: string | null;
  tags: string[];
  source: string | null;
  // Add enrollment count if needed from API
  // _count?: { enrollments?: number };
}

export interface WorkshopSummary {
  id: string;
  title: string;
  description: string | null;
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  location: string | null;
  presenter: string | null;
  // Add registration count if needed
  // _count?: { registrations?: number };
}

export interface MyEnrollment {
  id: string; // Enrollment ID
  status: string;
  progress: number;
  completedAt: string | null; // ISO Date string
  course: {
    // Include nested course info
    id: string;
    title: string;
    imageUrl: string | null;
    // Add other course fields if needed from your API select
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
// --- End Type Definitions ---

const ITEMS_PER_PAGE = 6; // Number of items per page for pagination

// --- Reusable Pagination Component ---
interface PaginationControlsProps {
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  "aria-label": string; // For accessibility
}

function PaginationControls({
  pagination,
  onPageChange,
  isLoading,
  "aria-label": ariaLabel,
}: PaginationControlsProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { currentPage, totalPages } = pagination;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Basic Page Number generation (can be enhanced)
  const pageNumbers: (number | string)[] = [];
  const delta = 1; // How many pages to show around current page
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  let l: number | null = null;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      pageNumbers.push(i);
      l = i;
    } else if (l !== null && i - l === 2) {
      pageNumbers.push(i - 1); // Add the missing page if gap is 1
      l = i;
    } else if (l !== null && i - l > 1) {
      pageNumbers.push("..."); // Add ellipsis for larger gaps
      l = null; // Reset l to prevent multiple ellipses
    }
  }

  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center justify-center space-x-1 sm:space-x-2 pt-4 col-span-full"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1 || isLoading}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="hidden sm:flex items-center space-x-1">
        {pageNumbers.map((page, index) =>
          typeof page === "number" ? (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              aria-current={currentPage === page ? "page" : undefined}
              aria-label={`Go to page ${page}`}
            >
              {page}
            </Button>
          ) : (
            <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm">
              ...
            </span>
          )
        )}
      </div>
      {/* Simple mobile indicator */}
      <div className="sm:hidden text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages || isLoading}
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  );
}

// --- Main Learning Hub Component ---
export function LearningHub() {
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === Role.ADMIN;

  // States
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopSummary[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<MyEnrollment[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [myEnrollmentsLoading, setMyEnrollmentsLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [workshopsError, setWorkshopsError] = useState<string | null>(null);
  const [myEnrollmentsError, setMyEnrollmentsError] = useState<string | null>(
    null
  );
  const [coursesPagination, setCoursesPagination] =
    useState<PaginationInfo | null>(null);
  const [workshopsPagination, setWorkshopsPagination] =
    useState<PaginationInfo | null>(null); // Added for workshops
  const [myEnrollmentsPagination, setMyEnrollmentsPagination] =
    useState<PaginationInfo | null>(null); // Added for my learning
  const [coursesPage, setCoursesPage] = useState(1);
  const [workshopsPage, setWorkshopsPage] = useState(1); // Added for workshops
  const [myEnrollmentsPage, setMyEnrollmentsPage] = useState(1); // Added for my learning
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  // Add tag filter state if needed: const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // --- Data Fetching ---
  const fetchCourses = useCallback(
    async (
      page = 1,
      search = "",
      difficulty: string | null = selectedDifficulty /* , tags = selectedTags */
    ) => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });
        if (search) params.set("search", search);
        if (difficulty) params.set("difficulty", difficulty);
        // if (tags && tags.length > 0) params.set('tags', tags.join(','));

        const res = await fetch(`/api/courses?${params.toString()}`);
        if (!res.ok)
          throw new Error(`Failed to fetch courses (status ${res.status})`);
        const data: PaginatedResponse<CourseSummary> = await res.json();
        setCourses(data.data);
        setCoursesPagination(data.pagination);
      } catch (err) {
        console.error("Fetch Courses Error:", err);
        setCoursesError(
          err instanceof Error ? err.message : "Failed to load courses"
        );
        setCourses([]);
        setCoursesPagination(null); // Clear on error
      } finally {
        setCoursesLoading(false);
      }
    },
    [selectedDifficulty /* , selectedTags */]
  ); // Dependency on filters

  const fetchWorkshops = useCallback(async (page = 1) => {
    setWorkshopsLoading(true);
    setWorkshopsError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      const res = await fetch(`/api/workshops?${params.toString()}`); // Assuming API supports pagination
      if (!res.ok)
        throw new Error(`Failed to fetch workshops (status ${res.status})`);
      const data: PaginatedResponse<WorkshopSummary> = await res.json();
      setWorkshops(data.data);
      setWorkshopsPagination(data.pagination);
    } catch (err) {
      console.error("Fetch Workshops Error:", err);
      setWorkshopsError(
        err instanceof Error ? err.message : "Failed to load workshops"
      );
      setWorkshops([]);
      setWorkshopsPagination(null);
    } finally {
      setWorkshopsLoading(false);
    }
  }, []);

  const fetchMyLearning = useCallback(async (page = 1) => {
    setMyEnrollmentsLoading(true);
    setMyEnrollmentsError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      const res = await fetch(`/api/enrollments/me?${params.toString()}`); // Assuming API supports pagination
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Please log in to view your progress.");
        throw new Error(
          `Failed to fetch learning progress (status ${res.status})`
        );
      }
      const data: PaginatedResponse<MyEnrollment> = await res.json();
      setMyEnrollments(data.data);
      setMyEnrollmentsPagination(data.pagination);
    } catch (err) {
      console.error("Fetch My Learning Error:", err);
      setMyEnrollmentsError(
        err instanceof Error ? err.message : "Failed to load learning progress"
      );
      setMyEnrollments([]);
      setMyEnrollmentsPagination(null);
    } finally {
      setMyEnrollmentsLoading(false);
    }
  }, []);

  // Fetching Effects
  useEffect(() => {
    fetchCourses(coursesPage, searchQuery, selectedDifficulty);
  }, [fetchCourses, coursesPage, searchQuery, selectedDifficulty]);
  useEffect(() => {
    fetchWorkshops(workshopsPage);
  }, [fetchWorkshops, workshopsPage]);
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchMyLearning(myEnrollmentsPage);
    } else if (sessionStatus === "unauthenticated") {
      setMyEnrollments([]);
      setMyEnrollmentsPagination(null);
      setMyEnrollmentsLoading(false);
      setMyEnrollmentsError(null);
    }
  }, [fetchMyLearning, myEnrollmentsPage, sessionStatus]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCoursesPage(1);
  };
  const handleDifficultyFilterChange = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty);
    setCoursesPage(1);
  };
  const handleDeleteCourse = useCallback(
    async (courseId: string, courseTitle: string) => {
      /* ... delete logic as before ... */
      if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`))
        return;
      try {
        const res = await fetch(`/api/courses/${courseId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to delete (status ${res.status})`
          );
        }
        toast.success(`Course "${courseTitle}" deleted.`);
        fetchCourses(coursesPage, searchQuery, selectedDifficulty); // Refresh
      } catch (err) {
        console.error("Delete Course Error:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete course."
        );
      }
    },
    [coursesPage, searchQuery, selectedDifficulty, fetchCourses]
  );

  // Render Helper
  const renderContent = <T,>(
    loading: boolean,
    error: string | null,
    data: T[],
    renderItem: (item: T, index: number) => React.ReactElement | null,
    SkeletonComponent: React.FC,
    noDataMessage: string | React.ReactElement,
    itemsToShow = 3
  ): React.ReactNode => {
    if (loading) {
      return Array.from({ length: itemsToShow }).map((_, i) => (
        <SkeletonComponent key={`sk-${i}`} />
      ));
    }
    if (error) {
      return (
        <Alert variant="destructive" className="col-span-full">
          <WifiOff className="h-4 w-4" />{" "}
          <AlertTitle>Error Loading Data</AlertTitle>{" "}
          <AlertDescription>{error}</AlertDescription>{" "}
        </Alert>
      );
    }
    if (data.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No Data Found</h3>
          <p className="text-sm text-muted-foreground">{noDataMessage}</p>
        </div>
      );
    }
    return data.map(renderItem).filter((item) => item !== null); // Filter out null returns if any
  };

  const canManageCourses = isAdmin;
  const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

  // Framer Motion Variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Learning Hub</h2>
        <div className="flex items-center gap-2">
          {canManageCourses && (
            <Button asChild size="sm">
              <Link href="/admin/learning/courses/create">
                <Plus className="mr-2 h-4 w-4" /> Create Course
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href="/learning/courses">Browse All Courses</Link>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              {selectedDifficulty || "Level"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handleDifficultyFilterChange(null)}
            >
              All Levels
            </DropdownMenuItem>
            {difficultyLevels.map((level) => (
              <DropdownMenuItem
                key={level}
                onSelect={() => handleDifficultyFilterChange(level)}
              >
                {level}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          <TabsTrigger value="my-learning">My Learning</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {renderContent(
              coursesLoading,
              coursesError,
              courses,
              (course, index) => (
                <motion.div key={course.id} variants={item}>
                  <CourseCard
                    course={course}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteCourse}
                  />
                </motion.div>
              ),
              CourseSkeleton,
              searchQuery || selectedDifficulty
                ? "No courses match your criteria."
                : "No courses available."
            )}
          </motion.div>
          <PaginationControls
            pagination={coursesPagination}
            onPageChange={setCoursesPage}
            isLoading={coursesLoading}
            aria-label="Courses pagination"
          />
        </TabsContent>

        {/* Workshops Tab */}
        <TabsContent value="workshops" className="space-y-4">
          <motion.div
            className="grid gap-4 md:grid-cols-1 lg:grid-cols-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {renderContent(
              workshopsLoading,
              workshopsError,
              workshops,
              (workshop, index) => (
                <motion.div key={workshop.id} variants={item}>
                  <WorkshopCard
                    workshop={workshop}
                    onRegisterSuccess={fetchWorkshops}
                  />
                </motion.div>
              ), // Pass refresh callback
              WorkshopSkeleton,
              "No upcoming workshops found."
            )}
          </motion.div>
          <PaginationControls
            pagination={workshopsPagination}
            onPageChange={setWorkshopsPage}
            isLoading={workshopsLoading}
            aria-label="Workshops pagination"
          />
        </TabsContent>

        {/* Mentorship Tab */}
        <TabsContent value="mentorship" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Program</CardTitle>
              <CardDescription>Connect & Grow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Find experienced colleagues to guide your career growth or sign
                up to share your expertise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* TODO: Link these buttons to actual mentorship pages */}
                <Button className="w-full sm:w-auto" asChild>
                  <Link href="/learning/mentorship/find">Browse Mentors</Link>
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" asChild>
                  <Link href="/learning/mentorship/become">
                    Become a Mentor
                  </Link>
                </Button>
              </div>
              {/* TODO: Add section displaying current mentorships if applicable */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Learning Tab */}
        <TabsContent value="my-learning" className="space-y-4">
          <motion.div
            className="grid gap-4 md:grid-cols-1 lg:grid-cols-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {sessionStatus === "unauthenticated" ? (
              <Alert className="col-span-full">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Not Logged In</AlertTitle>
                <AlertDescription>
                  Please log in to view your learning progress.
                </AlertDescription>
              </Alert>
            ) : (
              renderContent(
                myEnrollmentsLoading,
                myEnrollmentsError,
                myEnrollments,
                (enrollment, index) =>
                  enrollment?.course ? (
                    <motion.div key={enrollment.id} variants={item}>
                      <MyLearningCard enrollment={enrollment} />
                    </motion.div>
                  ) : null,
                MyLearningSkeleton,
                "You haven't enrolled in any courses yet."
              )
            )}
          </motion.div>
          <PaginationControls
            pagination={myEnrollmentsPagination}
            onPageChange={setMyEnrollmentsPage}
            isLoading={myEnrollmentsLoading}
            aria-label="My learning pagination"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== Child Components ==========

interface CourseCardProps {
  course: CourseSummary;
  isAdmin: boolean;
  onDelete: (courseId: string, courseTitle: string) => Promise<void>;
}
function CourseCard({ course, isAdmin, onDelete }: CourseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteClick = async () => {
    setIsDeleting(true);
    await onDelete(
      course.id,
      course.title
    ); /* No need to set false if successful */
  };
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {course.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={course.imageUrl}
            alt={course.title}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardHeader className={!course.imageUrl ? "" : "pt-4"}>
        <CardTitle className="text-lg line-clamp-2" title={course.title}>
          {course.title}
        </CardTitle>
        {course.difficulty && (
          <CardDescription>Level: {course.difficulty}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {course.description ?? "No description."}
        </p>
        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
        {isAdmin && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" asChild title="Edit Course">
              <Link href={`/admin/learning/courses/edit/${course.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Delete Course"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Button asChild size="sm" className={isAdmin ? "" : "ml-auto"}>
          <Link href={`/learning/courses/${course.id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface WorkshopCardProps {
  workshop: WorkshopSummary;
  onRegisterSuccess?: () => void;
} // Add callback prop
function WorkshopCard({ workshop, onRegisterSuccess }: WorkshopCardProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  // TODO: Add state to check if user IS ALREADY registered for this workshop

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/register`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to register (status ${res.status})`
        );
      }
      toast.success(`Successfully registered for "${workshop.title}"!`);
      onRegisterSuccess?.(); // Call the callback to potentially refresh workshop list or update UI
    } catch (err) {
      console.error("Workshop Register Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to register.");
    } finally {
      setIsRegistering(false);
    }
  };
  return (
    <div className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:space-x-4 rounded-md border p-4">
      <div className="flex-1">
        <h4 className="font-medium">{workshop.title}</h4>
        <div className="mt-1 text-sm text-muted-foreground">
          <Calendar className="inline-block h-3.5 w-3.5 mr-1" />
          {format(new Date(workshop.startTime), "PPp")}
        </div>
        {workshop.location && (
          <div className="mt-1 text-sm text-muted-foreground">
            Location: {workshop.location}
          </div>
        )}
        {workshop.presenter && (
          <div className="mt-1 text-sm text-muted-foreground">
            Presenter: {workshop.presenter}
          </div>
        )}
      </div>
      <Button
        size="sm"
        onClick={handleRegister}
        disabled={isRegistering}
        className="w-full sm:w-auto mt-2 sm:mt-0"
      >
        {isRegistering ? "Registering..." : "Register"}
      </Button>
    </div>
  );
}

interface MyLearningCardProps {
  enrollment: MyEnrollment;
}
function MyLearningCard({ enrollment }: MyLearningCardProps) {
  if (!enrollment.course) return null;
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <Link
          href={`/learning/courses/${enrollment.course.id}`}
          className="font-medium hover:underline"
        >
          {enrollment.course.title}
        </Link>
        <Badge
          variant={enrollment.status === "Completed" ? "default" : "secondary"}
        >
          {enrollment.status}
        </Badge>
      </div>
      {enrollment.status !== "Completed" && (
        <div className="space-y-1">
          <div className="flex justify-end text-xs text-muted-foreground">
            {enrollment.progress}% complete
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          {enrollment.completedAt
            ? `Completed: ${format(new Date(enrollment.completedAt), "PP")}`
            : "In Progress"}
        </span>
        <Button asChild size="sm" variant="outline" className="ml-auto">
          <Link href={`/learning/courses/${enrollment.course.id}`}>
            {enrollment.status === "Completed" ? "Review" : "Continue"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

// --- Skeleton Components ---
function CourseSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <Skeleton className="aspect-video rounded-t-lg" />
      <CardHeader className="pt-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex flex-wrap gap-1 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4 mt-auto">
        <Skeleton className="h-8 w-24 rounded-md" />
      </CardFooter>
    </Card>
  );
}
function WorkshopSkeleton() {
  return (
    <div className="flex items-start space-x-4 rounded-md border p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-9 w-20 rounded-md" />
    </div>
  );
}
function MyLearningSkeleton() {
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex justify-between gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-9 w-full mt-2 rounded-md" />
    </div>
  );
}

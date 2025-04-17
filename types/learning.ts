// (Can be in this file or a separate types file, e.g., types/learning.ts)
import { Role } from "@prisma/client"; // Assuming Role enum is available

// Matches the select statement in GET /api/courses
export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  difficulty: string | null;
  tags: string[];
  source: string | null;
  // Add _count if you select it in the API later
  // _count?: { enrollments?: number };
}

// Matches the select statement in GET /api/workshops
export interface WorkshopSummary {
    id: string;
    title: string;
    description: string | null;
    startTime: string; // ISO Date string
    endTime: string;   // ISO Date string
    location: string | null;
    presenter: string | null;
    // Add _count if selected
    // _count?: { registrations?: number };
}

// Matches the select statement in GET /api/enrollments/me
export interface MyEnrollment {
    id: string;
    status: string;
    progress: number;
    completedAt: string | null; // ISO Date string
    course: {
        id: string;
        title: string;
        imageUrl: string | null;
        difficulty: string | null;
        tags: string[];
    };
    // Add fields from Enrollment model if needed
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
}

// Type for the API response structure
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationInfo;
}

// types/learning.ts (or define in the component file)

// Matches the Prisma Course model structure (adjust based on your API's select statement)
export interface CourseDetails {
    id: string;
    title: string;
    description: string | null;
    source: string | null;
    url: string | null; // External course URL
    imageUrl: string | null;
    difficulty: string | null;
    tags: string[];
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
    // Add instructor/module details if your API includes them
    // instructor?: { name: string; title: string; avatar: string | null; bio: string | null };
    // modules?: { id: string; title: string; duration: string | null; }[];
    // Add enrollment count if included via _count
     _count?: { enrollments?: number };
}

// Matches the relevant parts of the MyEnrollment type for this specific course
export interface CourseEnrollmentStatus {
    id: string; // Enrollment ID
    status: string;
    progress: number;
    completedAt: string | null;
    // courseId: string; // Already known
    // userId: string; // Not needed on client usually
}
// app/api/courses/[courseId]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma, Role } from "@prisma/client";
import { getAuthenticatedUserId, hasRequiredPlatformRole } from "@/lib/session";

type RouteParams = { params: { courseId: string } };

const paramsSchema = z.object({
  //   courseId: z.string().cuid({ message: "Invalid course ID format" }),
  courseId: z
    .string()
    .length(27, { message: "Course ID must be 27 characters" }) // Option 1: Strict length check
    .regex(/^[a-z0-9]+$/, { message: "Course ID must be alphanumeric" }),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!params || typeof params !== "object" || !("courseId" in params)) {
      console.error("API route received invalid params structure:", params);
      return NextResponse.json(
        {
          message: "Internal server error: Invalid route parameters structure.",
        },
        { status: 500 }
      );
    }
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid course ID format",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { courseId } = validation.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      // Select all relevant fields for the detail view
      // You might want to include related data counts if needed
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Get Course Detail Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid course ID format",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2023"
    ) {
      // Handle cases where the ID format is invalid despite Zod CUID check (unlikely but possible)
      return NextResponse.json(
        { message: "Invalid course ID format provided." },
        { status: 400 }
      );
    }
    // findUniqueOrThrow throws P2025 if not found, but we handle manually above
    return NextResponse.json(
      { message: "An error occurred fetching course details" },
      { status: 500 }
    );
  }
}

// --- PUT/PATCH Logic (Update Course) ---
// Use .partial() to allow updating only some fields
const courseUpdateSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150)
      .optional(),
    description: z.string().max(5000).optional().nullable(),
    source: z.string().max(100).optional().nullable(),
    url: z.string().url("Invalid URL format").optional().nullable(),
    imageUrl: z.string().url("Invalid image URL format").optional().nullable(),
    difficulty: z.string().max(50).optional().nullable(),
    tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags").optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // --- Authorization: Admin Only ---
    const isAdmin = await hasRequiredPlatformRole([Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to update courses." },
        { status: 403 }
      );
    }
    // --- End Authorization ---

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          message: "Invalid course ID format",
          errors: paramsValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { courseId } = paramsValidation.data;

    const body = await request.json();
    const bodyValidation = courseUpdateSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: bodyValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateData = bodyValidation.data;

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData, // Pass validated partial data
    });

    return NextResponse.json(updatedCourse); // 200 OK
  } catch (error) {
    console.error("Update Course Error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    if (!(await getAuthenticatedUserId())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "An error occurred updating the course" },
      { status: 500 }
    );
  }
}

// --- DELETE Logic (Delete Course) ---
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // --- Authorization: Admin Only ---
    const isAdmin = await hasRequiredPlatformRole([Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to delete courses." },
        { status: 403 }
      );
    }
    // --- End Authorization ---

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          message: "Invalid course ID format",
          errors: paramsValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { courseId } = paramsValidation.data;

    // Optional: Check for enrollments before deleting or rely on cascade delete
    // const enrollments = await prisma.enrollment.count({ where: { courseId }});
    // if (enrollments > 0) { return NextResponse.json({ message: 'Cannot delete course with active enrollments.' }, { status: 400 }); }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    ); // Or 204 No Content
  } catch (error) {
    console.error("Delete Course Error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }
    // Handle P2003 if foreign key constraints prevent deletion (e.g., if cascade delete isn't set)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          message:
            "Cannot delete course due to existing relations (e.g., enrollments).",
        },
        { status: 409 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid course ID format",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    if (!(await getAuthenticatedUserId())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "An error occurred deleting the course" },
      { status: 500 }
    );
  }
}

// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import prisma from "@/lib/prisma";
import { z, ZodError } from "zod";

const UserProfileUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100).optional(), // Allow updating name
  hobbies: z.string().max(500, "Hobbies text too long").optional().nullable(), // Allow optional or null
  favoriteFood: z
    .string()
    .max(100, "Favorite food text too long")
    .optional()
    .nullable(),
  askMeAbout: z
    .string()
    .max(200, "Ask me about text too long")
    .optional()
    .nullable(),
  // Add validation for other fields if needed
});
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        points: true,
        createdAt: true, // Optional: for "Member since"
        // --- Include UserBadges and nested Badge details ---
        hobbies: true,
        favoriteFood: true,
        askMeAbout: true,
        userBadges: {
          orderBy: { earnedAt: "desc" }, // Show most recent first
          select: {
            earnedAt: true,
            badge: {
              // Select fields from the related Badge model
              select: {
                id: true,
                name: true,
                description: true,
                iconName: true, // Get the icon identifier
              },
            },
          },
        },
        // --- End Include ---
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// --- PUT Handler (Update Profile) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    // Validate the incoming data
    const dataToUpdate = UserProfileUpdateSchema.parse(json);

    // Ensure we don't pass undefined fields that weren't meant to be updated
    // Or simply pass the validated data directly if Prisma handles undefined correctly (it usually does)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: dataToUpdate.name, // Update name if provided
        hobbies: dataToUpdate.hobbies, // Update hobbies if provided (or set to null)
        favoriteFood: dataToUpdate.favoriteFood,
        askMeAbout: dataToUpdate.askMeAbout,
      },
      select: {
        // Return updated profile subset (optional)
        id: true,
        name: true,
        hobbies: true,
        favoriteFood: true,
        askMeAbout: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      console.error("Profile Update Validation Error:", error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

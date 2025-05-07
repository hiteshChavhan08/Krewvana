// lib/actions/adminActions.ts
"use server"; // Mark this file as containing Server Actions

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth"; // Your auth functions
import { revalidatePath } from "next/cache"; // To potentially refresh admin UI data
import { KudosAppreciationCategory } from "@prisma/client";

// Define the example categories
const exampleCategories = [
  { name: "Teamwork", description: "Recognizing collaborative efforts and support.", iconName: "Users" },
  { name: "Innovation", description: "Celebrating creative solutions and new ideas.", iconName: "Lightbulb" },
  { name: "Extra Mile", description: "Appreciating those who go above and beyond expectations.", iconName: "Rocket" },
  { name: "Customer Focus", description: "Highlighting exceptional service and dedication to customer success.", iconName: "HeartHandshake" },
  { name: "Mentorship", description: "Acknowledging guidance and support provided to others.", iconName: "GraduationCap" },
  { name: "Positive Attitude", description: "Applauding enthusiasm and a constructive approach.", iconName: "Smile" },
  { name: "Problem Solving", description: "Recognizing effective and analytical solutions.", iconName: "Wrench" },
];

// Server Action to seed categories
export async function seedExampleKudosCategories(): Promise<{ success: boolean; message: string; addedCount: number }> {
  try {
    // 1. Authentication & Authorization
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Unauthorized: Not logged in.", addedCount: 0 };
    }
    if (!isAdmin(user)) {
      return { success: false, message: "Forbidden: Admin privileges required.", addedCount: 0 };
    }

    let addedCount = 0;
    const results = [];

    // 2. Check existing and create missing categories (idempotent)
    for (const cat of exampleCategories) {
      const existing = await prisma.kudosAppreciationCategory.findUnique({
        where: { name: cat.name },
      });

      if (!existing) {
        const created = await prisma.kudosAppreciationCategory.create({
          data: cat,
        });
        results.push(created);
        addedCount++;
        console.log(`[Seed Action] Added Kudos Category: ${cat.name}`);
      } else {
        console.log(`[Seed Action] Kudos Category already exists: ${cat.name}`);
      }
    }

    // 3. Revalidate path if needed (to refresh admin page data if fetched via RSC)
    if (addedCount > 0) {
       revalidatePath('/app/admin'); // Revalidate the admin page path
       // Also revalidate the API path if client components fetch directly
       // Note: revalidatePath might not directly trigger client-side refetch for useQuery without extra setup
    }

    // 4. Return success
    return {
      success: true,
      message: `Seeding complete. Added ${addedCount} new categories.`,
      addedCount: addedCount,
    };
  } catch (error) {
    console.error("[Server Action Error] seedExampleKudosCategories:", error);
    return { success: false, message: "An error occurred during seeding.", addedCount: 0 };
  }
}
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// GET Handler - List users (potential hosts)
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    // Require authentication to view users? Optional, depends on your policy.
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Optional: Only allow Admins to fetch the full user list?
    // if (currentUser.role !== UserRole.ADMIN) {
    //     return new NextResponse('Forbidden', { status: 403 });
    // }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10); // Default limit
    const page = parseInt(searchParams.get("page") || "1", 10);
    const searchTerm = searchParams.get("search"); // Optional search term for name/email
    const excludeId = searchParams.get("excludeId");

    let whereClause: any = {};

    // Exclude the current admin from the list? Often useful.
    // whereClause.id = { not: currentUser.id };
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }
    // Add search functionality if needed
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    } else if (!excludeId) {
      // Optimization: If no search and no exclude, don't send empty where clause unless necessary
      // However, keeping it simple: whereClause remains {} which finds all (respecting excludeId if set)
    }

    // ... skip logic for pagination ...

    // const userss = await prisma.user.findMany({
    //   where: whereClause,
    //   select: { id: true, name: true, email: true, image: true },
    //   orderBy: { name: "asc" },
    //   take: limit,
    //   // skip: skip,
    // });

    // Add filtering by role if the query param exists (though we decided anyone can host)
    // const roleFilter = searchParams.get('role');
    // if (roleFilter === 'host') { // Or any other specific role logic
    //    whereClause.role = UserRole.USER; // Example: only list standard users as potential hosts
    // }

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          // Select only needed fields for the dropdown
          id: true,
          name: true,
          email: true, // Include email as fallback display name
          image: true, // Optional: maybe display avatar in dropdown later
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: skip,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Return data in a structure suitable for pagination if needed,
    // or just the user list if pagination isn't implemented in the dialog.
    return NextResponse.json(users); // Return just the array for now
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

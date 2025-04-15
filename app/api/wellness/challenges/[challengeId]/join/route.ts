// app/api/wellness/challenges/[challengeId]/join/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getAuthenticatedUserId } from "@/lib/session";

type RouteParams = { params: { challengeId: string } };

const paramsSchema = z.object({
  challengeId: z.string().cuid({ message: "Invalid challenge ID format" }),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid challenge ID format",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { challengeId } = validation.data;

    // 1. Check if challenge exists and is joinable (currently active)
    const challenge = await prisma.wellnessChallenge.findUnique({
      where: { id: challengeId },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }
    const now = new Date();
    // Allow joining if challenge is active or upcoming? Decide on rules. Let's allow joining active only.
    if (now < challenge.startDate || now > challenge.endDate) {
      return NextResponse.json(
        { message: "Challenge is not currently active for joining" },
        { status: 400 }
      );
    }

    // 2. Attempt to create the participant record
    const newParticipant = await prisma.challengeParticipant.create({
      data: {
        userId: userId,
        wellnessChallengeId: challengeId,
        progress: 0, // Start progress at 0
      },
      select: {
        // Select fields to return
        id: true,
        userId: true,
        wellnessChallengeId: true,
        joinedAt: true,
        progress: true,
        // Optionally include challenge title for context
        wellnessChallenge: { select: { title: true } },
      },
    });

    return NextResponse.json(newParticipant, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Join Challenge Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Check for unique constraint violation (user already joined)
      if (
        error.code === "P2002" &&
        (error.meta?.target as string[])?.includes("userId") &&
        (error.meta?.target as string[])?.includes("wellnessChallengeId")
      ) {
        return NextResponse.json(
          { message: "You are already participating in this challenge" },
          { status: 409 }
        ); // Conflict
      }
      // Handle foreign key constraint fail if challenge check was skipped
      if (
        error.code === "P2003" &&
        (error.meta?.field_name as string)?.includes("wellnessChallengeId")
      ) {
        return NextResponse.json(
          { message: "Challenge not found." },
          { status: 404 }
        );
      }
    }
    if (error instanceof z.ZodError) {
      // Handles param validation
      return NextResponse.json(
        {
          message: "Invalid challenge ID format",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    if (!(await getAuthenticatedUserId())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "An error occurred joining the challenge" },
      { status: 500 }
    );
  }
}

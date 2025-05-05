// app/api/users/me/route.ts
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondNotFound,
  ApiError,
  BadRequestError,
  NotFoundError,
} from "@/lib/api/responses";
// Import NEW service functions and schema
import {
  getUserProfile,
  updateUserSettings,
  UserSettingsUpdateSchema,
} from "@/services/userService"; // Adjust path

// GET Handler (Uses updated service)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return respondUnauthorized();
    const userProfile = await getUserProfile(user.id); // Service handles not found
    return respondSuccess(userProfile);
  } catch (error: any) {
    if (error instanceof NotFoundError) return respondNotFound(error.message);
    if (error.status === 401) return respondUnauthorized(error.message);
    console.error("[API GET /api/users/me] Error:", error);
    return respondError("Failed to fetch user profile.");
  }
}

// PUT Handler (Uses updated service and schema)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return respondUnauthorized();

    // Parse and validate the extended settings payload
    let validatedData: z.infer<typeof UserSettingsUpdateSchema>;
    try {
      const body = await request.json();
      const validation = UserSettingsUpdateSchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedData = validation.data;
      // Ensure at least one field is being updated
      if (Object.keys(validatedData).length === 0) {
        throw new BadRequestError("No fields provided for update.");
      }
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e;
      if (e instanceof z.ZodError) {
        throw new BadRequestError(
          "Validation failed.",
          e.flatten().fieldErrors as any
        );
      }
      throw e;
    }

    // Call the updated service function
    const updatedUser = await updateUserSettings(user.id, validatedData);

    return respondSuccess(updatedUser); // Return updated user subset
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof NotFoundError) return respondNotFound(error.message); // e.g., Position ID not valid? (service should handle)
      if (error.status === 401) return respondUnauthorized(error.message);
    }
    console.error("[API PUT /api/users/me] Error:", error);
    return respondError("Failed to update settings.");
  }
}

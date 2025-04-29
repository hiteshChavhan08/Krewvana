// lib/api/responses.ts (NEW FILE or add to existing API utils)
import { NextResponse } from "next/server";
import { ZodIssue } from "zod";

export const respondSuccess = <T>(
  data: T,
  status: number = 200
): NextResponse<T> => {
  return NextResponse.json(data, { status });
};

export const respondNoContent = (): NextResponse<null> => {
  return new NextResponse(null, { status: 204 });
};

export const respondError = (
  message: string = "Internal Server Error",
  status: number = 500
): NextResponse<{ message: string }> => {
  console.error(`API Error (${status}): ${message}`); // Log server-side
  return NextResponse.json({ message }, { status });
};

export const respondBadRequest = (
  message: string = "Bad Request",
  errors?: ZodIssue[] | null
): NextResponse<{ message: string; errors?: ZodIssue[] }> => {
  const responseBody: { message: string; errors?: ZodIssue[] } = { message };
  if (errors) {
    responseBody.errors = errors;
  }
  return NextResponse.json(responseBody, { status: 400 });
};

export const respondUnauthorized = (
  message: string = "Unauthorized"
): NextResponse<{ message: string }> => {
  return NextResponse.json({ message }, { status: 401 });
};

export const respondForbidden = (
  message: string = "Forbidden"
): NextResponse<{ message: string }> => {
  return NextResponse.json({ message }, { status: 403 });
};

export const respondNotFound = (
  resource: string = "Resource"
): NextResponse<{ message: string }> => {
  return NextResponse.json(
    { message: `${resource} not found` },
    { status: 404 }
  );
};

// Custom Error Classes for specific handling
export class ApiError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}
export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}
export class BadRequestError extends ApiError {
  public readonly errors?: ZodIssue[];
  constructor(message = "Bad Request", errors?: ZodIssue[] | null) {
    super(message, 400);
    this.errors = errors ?? undefined;
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export const respondConflict = (
  message: string = "Conflict"
): NextResponse<{ message: string }> => {
  return NextResponse.json({ message }, { status: 409 });
};

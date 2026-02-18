/**
 * API Utility Functions
 * Provides standardized response formatting and error handling
 */

import { NextResponse } from "next/server";

/**
 * Standard API success response
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Standard API error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Bad request response
 */
export function badRequestResponse(message: string) {
  return errorResponse(message, 400);
}

/**
 * Wraps an async operation with standardized error handling
 * @param operation The async operation to execute
 * @param operationName Description of the operation for logging
 * @returns Result of operation or throws error
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error ${operationName}:`, error);
    throw error;
  }
}

/**
 * Validates required fields in request body
 * @param body Request body object
 * @param requiredFields Array of required field names
 * @returns null if valid, error response if not
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): NextResponse | null {
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    return badRequestResponse(
      `Missing required fields: ${missingFields.join(", ")}`
    );
  }

  return null;
}

/**
 * Safely parse JSON from request
 * @param request Request object
 * @returns Parsed JSON or error response
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ body: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    return { body };
  } catch (error) {
    return {
      error: badRequestResponse("Invalid JSON in request body"),
    };
  }
}

/**
 * Creates a paginated response with metadata
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number
) {
  return successResponse({
    items,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      hasNext: page * perPage < total,
      hasPrevious: page > 1,
    },
  });
}

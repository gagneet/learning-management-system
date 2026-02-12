/**
 * User Theme Preference API
 * 
 * PATCH /api/users/theme - Update user's theme preference
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/users/theme
 * Update user's theme preference
 * 
 * Body:
 * - themePreference: "LIGHT" | "GRAY" | "DARK"
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate theme preference
    if (!body.themePreference || !["LIGHT", "GRAY", "DARK"].includes(body.themePreference)) {
      return NextResponse.json(
        { error: "Invalid themePreference. Must be LIGHT, GRAY, or DARK" },
        { status: 400 }
      );
    }

    // Update user's theme preference
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        themePreference: body.themePreference,
      },
      select: {
        id: true,
        email: true,
        name: true,
        themePreference: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Error updating theme preference:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

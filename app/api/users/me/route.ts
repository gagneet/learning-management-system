import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        dateOfBirth: true,
        languagePreference: true,
        themePreference: true,
        ageTier: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, avatar, dateOfBirth, languagePreference, themePreference, ageTier } = body;

    const updateData: {
      name?: string;
      bio?: string | null;
      avatar?: string | null;
      dateOfBirth?: Date | null;
      languagePreference?: string;
      themePreference?: "LIGHT" | "GRAY" | "DARK";
      ageTier?: "TIER1" | "TIER2" | "TIER3";
    } = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (languagePreference !== undefined) updateData.languagePreference = languagePreference;
    if (themePreference !== undefined) updateData.themePreference = themePreference;
    if (ageTier !== undefined) updateData.ageTier = ageTier;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        dateOfBirth: true,
        languagePreference: true,
        themePreference: true,
        ageTier: true,
        role: true,
      },
    });

    return NextResponse.json({ user, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

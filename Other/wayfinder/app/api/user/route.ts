import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.warn("Unauthorized access attempt to update user profile");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Invalid request body:", e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userAddress, userAddressLatitude, userAddressLongitude } = body;

    if (!userAddress || typeof userAddress !== "string") {
      console.error("Invalid or missing userAddress:", userAddress);
      return NextResponse.json(
        { error: "userAddress is required and must be a string" },
        { status: 400 }
      );
    }

    if (
      (userAddressLatitude !== undefined &&
        typeof userAddressLatitude !== "number") ||
      (userAddressLongitude !== undefined &&
        typeof userAddressLongitude !== "number")
    ) {
      console.error("Invalid coordinates:", {
        userAddressLatitude,
        userAddressLongitude,
      });
      return NextResponse.json(
        { error: "Coordinates must be numbers" },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
    } catch (e) {
      console.error("Database connection error:", e);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    let user;
    try {
      user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          userAddress,
          ...(userAddressLatitude !== undefined && { userAddressLatitude }),
          ...(userAddressLongitude !== undefined && { userAddressLongitude }),
        },
        { new: true }
      );
    } catch (e) {
      console.error("Database update error:", e);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    if (!user) {
      console.error("User not found for update:", { userId });
      return NextResponse.json(
        { error: "User not found. Please try signing out and back in." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error updating user:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

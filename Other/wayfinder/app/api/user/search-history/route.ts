import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { address, latitude, longitude } = body;

    try {
      await connectToDatabase();
    } catch (err) {
      console.error("[search-history] DB connect failed, skipping save:", err);
      return NextResponse.json(
        { warning: "Database unavailable - search history not saved" },
        { status: 200 }
      );
    }

    await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $push: {
          searchHistory: {
            $each: [{ address, latitude, longitude, timestamp: new Date() }],
            $position: 0,
            $slice: 50,
          },
        },
      }
    );

    const user = await User.findOne({ clerkId: userId });
    if (user) {
      const existingFrequent = user.frequentAddresses.find(
        (fa) => fa.address === address
      );

      if (existingFrequent) {
        await User.findOneAndUpdate(
          { clerkId: userId, "frequentAddresses.address": address },
          {
            $inc: { "frequentAddresses.$.count": 1 },
            $set: { "frequentAddresses.$.lastVisited": new Date() },
          }
        );
      } else {
        await User.findOneAndUpdate(
          { clerkId: userId },
          {
            $push: {
              frequentAddresses: {
                address,
                latitude,
                longitude,
                count: 1,
                lastVisited: new Date(),
              },
            },
          }
        );
      }
    }

    const updatedUser = await User.findOne({ clerkId: userId });
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error adding to search history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Clear search history
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("historyId");

    try {
      await connectToDatabase();
    } catch (err) {
      console.error(
        "[search-history] DB connect failed (DELETE), skipping operation:",
        err
      );
      return NextResponse.json(
        { warning: "Database unavailable - nothing deleted" },
        { status: 200 }
      );
    }

    if (historyId) {
      // Delete specific history item
      const user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $pull: {
            searchHistory: { _id: historyId },
          },
        },
        { new: true }
      );

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    } else {
      // Clear all search history
      const user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $set: { searchHistory: [] },
        },
        { new: true }
      );

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    }
  } catch (error) {
    console.error("Error deleting search history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

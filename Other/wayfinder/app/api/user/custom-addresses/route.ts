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
    const {
      addressName,
      address,
      latitude,
      longitude,
      default: isDefault,
    } = body;

    await connectToDatabase();

    if (isDefault) {
      await User.findOneAndUpdate(
        { clerkId: userId },
        { $set: { "customAddresses.$[].default": false } }
      );
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $push: {
          customAddresses: {
            addressName,
            address,
            latitude,
            longitude,
            default: isDefault || false,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error adding custom address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("addressId");

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $pull: {
          customAddresses: { _id: addressId },
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error deleting custom address:", error);
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      addressId,
      addressName,
      address,
      latitude,
      longitude,
      default: isDefault,
    } = body;

    await connectToDatabase();

    if (isDefault) {
      await User.findOneAndUpdate(
        { clerkId: userId },
        { $set: { "customAddresses.$[].default": false } }
      );
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId, "customAddresses._id": addressId },
      {
        $set: {
          "customAddresses.$.addressName": addressName,
          "customAddresses.$.address": address,
          "customAddresses.$.latitude": latitude,
          "customAddresses.$.longitude": longitude,
          "customAddresses.$.default": isDefault || false,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating custom address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

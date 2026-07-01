import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { whitelistSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const list = await prisma.whitelist.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching whitelist:", error);
    return NextResponse.json({ error: "Failed to fetch whitelist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Restrict to admins
  const userEmail = session.user.email.toLowerCase();
  const currentUser = await prisma.whitelist.findUnique({
    where: { email: userEmail },
  });

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validationResult = whitelistSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const emailLower = data.email.toLowerCase();

    const existing = await prisma.whitelist.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      return NextResponse.json({ error: "Email is already whitelisted" }, { status: 400 });
    }

    const whitelistEntry = await prisma.whitelist.create({
      data: {
        email: emailLower,
        name: data.name,
        role: data.role,
      },
    });

    // Log this action
    await prisma.activityLog.create({
      data: {
        userEmail: session.user.email,
        action: "Whitelist Added",
        details: `Whitelisted new email: ${emailLower} as ${data.role}`,
      },
    });

    return NextResponse.json(whitelistEntry, { status: 201 });
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    return NextResponse.json({ error: "Failed to add whitelist entry" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Restrict to admins
  const userEmail = session.user.email.toLowerCase();
  const currentUser = await prisma.whitelist.findUnique({
    where: { email: userEmail },
  });

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    const entry = await prisma.whitelist.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Whitelist entry not found" }, { status: 404 });
    }

    // Prevent deleting oneself
    if (entry.email.toLowerCase() === userEmail) {
      return NextResponse.json({ error: "You cannot remove yourself from the whitelist" }, { status: 400 });
    }

    await prisma.whitelist.delete({
      where: { id },
    });

    // Log this action
    await prisma.activityLog.create({
      data: {
        userEmail: session.user.email,
        action: "Whitelist Removed",
        details: `Removed email from whitelist: ${entry.email}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    return NextResponse.json({ error: "Failed to remove whitelist entry" }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Restrict to admins
  const userEmail = session.user.email.toLowerCase();
  const currentUser = await prisma.whitelist.findUnique({
    where: { email: userEmail },
  });

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role || (role !== "admin" && role !== "user")) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const entry = await prisma.whitelist.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Whitelist entry not found" }, { status: 404 });
    }

    // Prevent changing ones own role to user
    if (entry.email.toLowerCase() === userEmail && role === "user") {
      return NextResponse.json({ error: "You cannot demote yourself from admin status" }, { status: 400 });
    }

    const updated = await prisma.whitelist.update({
      where: { id },
      data: { role },
    });

    // Log this action
    await prisma.activityLog.create({
      data: {
        userEmail: session.user.email,
        action: "Whitelist Role Updated",
        details: `Updated role of ${entry.email} to ${role}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating whitelist role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

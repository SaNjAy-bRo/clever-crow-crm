import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { updateLeadScoreAndTemp } from "@/lib/scoring";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const where: any = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        client: {
          select: {
            name: true,
            businessName: true,
            dealOwnerEmail: true,
            phoneNumber: true,
            whatsappNumber: true
          }
        }
      }
    });

    return NextResponse.json(followUps);
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, date, type, notes, nextAction, status } = body;

    if (!clientId || !date || !type) {
      return NextResponse.json({ error: "Missing required fields: clientId, date, type" }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        clientId,
        date: new Date(date),
        type,
        notes: notes || "",
        nextAction: nextAction || "",
        status: status || "Pending",
      },
    });

    // Automatically update Client's status to Follow-Up if the status has progressed
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (client && client.status === "New Prospect") {
      await prisma.client.update({
        where: { id: clientId },
        data: { status: "Follow-Up" }
      });
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        clientId,
        userEmail: session.user.email,
        action: "Follow-Up Scheduled",
        details: `Scheduled ${type} follow-up on ${new Date(date).toLocaleDateString()}. Next Action: ${nextAction || "None"}`,
      },
    });

    // Update scoring
    await updateLeadScoreAndTemp(clientId);

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, notes, nextAction } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields: id, status" }, { status: 400 });
    }

    const existing = await prisma.followUp.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : existing.notes,
        nextAction: nextAction !== undefined ? nextAction : existing.nextAction,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        clientId: existing.clientId,
        userEmail: session.user.email,
        action: "Follow-Up Completed",
        details: `Follow-up updated to "${status}". Notes: ${notes || "None"}`,
      },
    });

    // Update scoring
    await updateLeadScoreAndTemp(existing.clientId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating follow-up:", error);
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}

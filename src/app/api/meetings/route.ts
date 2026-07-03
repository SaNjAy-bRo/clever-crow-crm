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

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        client: {
          select: {
            name: true,
            businessName: true,
            dealOwnerEmail: true,
          }
        }
      }
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, date, type, location, agenda, notes, assignedTo, status } = body;

    if (!clientId || !date || !type || !agenda) {
      return NextResponse.json({ error: "Missing required fields: clientId, date, type, agenda" }, { status: 400 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        clientId,
        date: new Date(date),
        type,
        location: location || null,
        agenda,
        notes: notes || "",
        assignedTo: assignedTo || session.user.email,
        status: status || "Scheduled",
      },
    });

    // Update Client's status to Meeting Scheduled
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "Meeting Scheduled" }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        clientId,
        userEmail: session.user.email,
        action: "Meeting Booked",
        details: `Booked meeting (${type}) for ${new Date(date).toLocaleString()}. Agenda: ${agenda}`,
      },
    });

    // Update scoring
    await updateLeadScoreAndTemp(clientId);

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      status,
      notes,
      requirementSummary,
      nextStep,
      afterMeetingUpdated,
      clientNeeds,
      budgetIdea,
      urgency,
      decisionMaker,
      competitor,
      proposalRequired
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    const existing = await prisma.meeting.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        requirementSummary: requirementSummary !== undefined ? requirementSummary : existing.requirementSummary,
        nextStep: nextStep !== undefined ? nextStep : existing.nextStep,
        afterMeetingUpdated: afterMeetingUpdated !== undefined ? afterMeetingUpdated : existing.afterMeetingUpdated,
        clientNeeds: clientNeeds !== undefined ? clientNeeds : existing.clientNeeds,
        budgetIdea: budgetIdea !== undefined ? budgetIdea : existing.budgetIdea,
        urgency: urgency !== undefined ? urgency : existing.urgency,
        decisionMaker: decisionMaker !== undefined ? decisionMaker : existing.decisionMaker,
        competitor: competitor !== undefined ? competitor : existing.competitor,
        proposalRequired: proposalRequired !== undefined ? proposalRequired : existing.proposalRequired,
      },
    });

    // If meeting is marked completed, log it and transition client status
    if (status === "Completed" && existing.status !== "Completed") {
      let clientStatus = "Discovery Done";
      if (proposalRequired) {
        clientStatus = "Proposal Required";
      }

      const budgetVal = budgetIdea ? parseFloat(budgetIdea) : 0;
      await prisma.client.update({
        where: { id: existing.clientId },
        data: {
          status: clientStatus,
          ...(budgetVal > 0 ? { dealValue: budgetVal, value: budgetVal } : {})
        }
      });
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        clientId: existing.clientId,
        userEmail: session.user.email,
        action: "Meeting Updated",
        details: `Updated meeting details. Status: ${status || existing.status}. After-Meeting notes saved.`,
      },
    });

    // Update scoring
    await updateLeadScoreAndTemp(existing.clientId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }
}

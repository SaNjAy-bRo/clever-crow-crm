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

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { date: "desc" },
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

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, title, serviceOffered, value, date, sentBy, sentTo, status, expectedClosingDate, closingProbability, notes, filePath } = body;

    if (!clientId || !title || !serviceOffered || !value) {
      return NextResponse.json({ error: "Missing required fields: clientId, title, serviceOffered, value" }, { status: 400 });
    }

    const proposal = await prisma.proposal.create({
      data: {
        clientId,
        title,
        serviceOffered,
        value: parseFloat(value) || 0,
        date: date ? new Date(date) : new Date(),
        sentBy: sentBy || session.user.email,
        sentTo: sentTo || "",
        status: status || "Sent",
        expectedClosingDate: expectedClosingDate ? new Date(expectedClosingDate) : null,
        closingProbability: parseFloat(closingProbability) || 0,
        notes: notes || "",
        filePath: filePath || null,
      },
    });

    // Update Client status to "Proposal Sent" and update deal value
    await prisma.client.update({
      where: { id: clientId },
      data: {
        status: "Proposal Sent",
        dealValue: parseFloat(value) || 0,
        value: parseFloat(value) || 0,
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        clientId,
        userEmail: session.user.email,
        action: "Proposal Sent",
        details: `Sent proposal "${title}" for ${serviceOffered} (Value: ₹${parseFloat(value).toLocaleString()}).`,
      },
    });

    // Update scoring
    await updateLeadScoreAndTemp(clientId);

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, expectedClosingDate, closingProbability, notes, filePath } = body;

    if (!id) {
      return NextResponse.json({ error: "Proposal ID is required" }, { status: 400 });
    }

    const existing = await prisma.proposal.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        expectedClosingDate: expectedClosingDate ? new Date(expectedClosingDate) : existing.expectedClosingDate,
        closingProbability: closingProbability !== undefined ? parseFloat(closingProbability) : existing.closingProbability,
        notes: notes !== undefined ? notes : existing.notes,
        filePath: filePath !== undefined ? filePath : existing.filePath,
      },
    });

    // If proposal is approved/closed won, check if we transition client status
    if (status === "Approved" || status === "Closed Won") {
      await prisma.client.update({
        where: { id: existing.clientId },
        data: {
          status: "Negotiation",
          ...(existing.value > 0 ? { dealValue: existing.value, value: existing.value } : {})
        }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        clientId: existing.clientId,
        userEmail: session.user.email,
        action: "Proposal Updated",
        details: `Updated proposal "${existing.title}" status to "${status || existing.status}".`,
      },
    });

    // Update scoring
    await updateLeadScoreAndTemp(existing.clientId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}

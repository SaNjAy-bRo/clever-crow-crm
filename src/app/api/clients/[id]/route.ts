import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations";

const getSymbol = (currency: string) => {
  return "₹";
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
        },
        followUps: {
          orderBy: { date: "asc" },
        },
        meetings: {
          orderBy: { date: "asc" },
        },
        proposals: {
          orderBy: { date: "desc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        checkIns: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client details:", error);
    return NextResponse.json({ error: "Failed to fetch client details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    
    // Validate with Zod
    const validationResult = clientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Fetch the existing client to see what changed
    const existing = await prisma.client.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check role of current user
    const dbUser = await prisma.whitelist.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });
    const role = dbUser?.role || "user";

    if (role !== "admin") {
      const statusChangedToWon = existing.status !== "Closed Won" && data.status === "Closed Won";
      const convertedChangedToTrue = !existing.isConvertedClient && data.isConvertedClient === true;
      if (statusChangedToWon || convertedChangedToTrue) {
        return NextResponse.json(
          { error: "Forbidden: Only administrators can set status to Closed Won / Converted Client" },
          { status: 403 }
        );
      }
    }

    // Determine what changed
    const changes: string[] = [];
    if (existing.name !== data.name) changes.push(`Name: "${existing.name}" → "${data.name}"`);
    if (existing.businessName !== data.businessName) changes.push(`Business: "${existing.businessName}" → "${data.businessName}"`);
    if (existing.phoneNumber !== data.phoneNumber) changes.push(`Phone: "${existing.phoneNumber}" → "${data.phoneNumber}"`);
    if (existing.status !== data.status) changes.push(`Status: "${existing.status}" → "${data.status}"`);
    if (existing.dealValue !== data.dealValue) changes.push(`Deal Value: ${existing.dealValue} → ${data.dealValue}`);
    if (existing.isConvertedClient !== data.isConvertedClient) changes.push(`Converted to Client: ${existing.isConvertedClient} → ${data.isConvertedClient}`);
    if (existing.score !== data.score) changes.push(`Score: ${existing.score} → ${data.score}`);
    if (existing.temperature !== data.temperature) changes.push(`Temperature: ${existing.temperature} → ${data.temperature}`);

    const detailsStr = changes.length > 0 ? changes.join(", ") : "Updated details";

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        businessName: data.businessName,
        phoneNumber: data.phoneNumber,
        whatsappNumber: data.whatsappNumber || null,
        email: data.email || null,
        website: data.website || null,
        instagram: data.instagram || null,
        googleMap: data.googleMap || null,
        city: data.city || null,
        area: data.area || null,
        industry: data.industry || null,
        category: data.category || null,
        source: data.source || null,
        serviceInterests: data.serviceInterests || "[]",
        status: data.status,
        address: data.address || null,
        notes: data.notes || null,
        serviceDetails: data.serviceDetails || null,

        // Financials
        value: data.value,
        currency: data.currency,
        dealValue: data.dealValue,
        advanceAmount: data.advanceAmount,
        balanceAmount: data.balanceAmount,
        paymentStatus: data.paymentStatus,
        invoiceStatus: data.invoiceStatus,
        gstRequired: data.gstRequired,
        collectionDate: data.collectionDate ? new Date(data.collectionDate) : null,
        expectedBalanceDate: data.expectedBalanceDate ? new Date(data.expectedBalanceDate) : null,
        dealOwnerEmail: data.dealOwnerEmail,
        incentiveEligible: data.incentiveEligible,
        dealStatus: data.dealStatus,

        // Score
        score: data.score,
        temperature: data.temperature,
        lostReason: data.lostReason,

        // Conversion / Onboarding
        isConvertedClient: data.isConvertedClient,
        clientStartDate: data.clientStartDate ? new Date(data.clientStartDate) : null,
        projectManager: data.projectManager,
        projectStatus: data.projectStatus,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        onboardingChecklist: data.onboardingChecklist,

        activities: {
          create: {
            userEmail: session.user.email,
            action: "Updated Client",
            details: `Updated client details. Changes: ${detailsStr}`,
          },
        },
      },
      include: {
        activities: true,
        followUps: true,
        meetings: true,
        proposals: true,
        attachments: true,
        checkIns: true,
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.client.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id },
    });

    // Create a general activity log (not associated with the deleted client anymore)
    await prisma.activityLog.create({
      data: {
        userEmail: session.user.email,
        action: "Deleted Client",
        details: `Deleted client ${existing.name} (${existing.businessName}) which was valued at ${getSymbol(existing.currency)}${existing.value.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations";

const getSymbol = (currency: string) => {
  if (currency === "INR") return "₹";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
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

    // Determine what changed
    const changes: string[] = [];
    if (existing.name !== data.name) changes.push(`Name: "${existing.name}" → "${data.name}"`);
    if (existing.businessName !== data.businessName) changes.push(`Business: "${existing.businessName}" → "${data.businessName}"`);
    if (existing.phoneNumber !== data.phoneNumber) changes.push(`Phone: "${existing.phoneNumber}" → "${data.phoneNumber}"`);
    if (existing.address !== data.address) changes.push(`Address: "${existing.address}" → "${data.address}"`);
    if (existing.notes !== data.notes) changes.push(`Notes updated`);
    if (existing.serviceDetails !== data.serviceDetails) changes.push(`Service Details updated`);
    if (existing.status !== data.status) changes.push(`Status: "${existing.status}" → "${data.status}"`);
    if (existing.value !== data.value || existing.currency !== data.currency) {
      changes.push(`Value: ${getSymbol(existing.currency)}${existing.value.toLocaleString()} → ${getSymbol(data.currency)}${data.value.toLocaleString()}`);
    }

    const detailsStr = changes.length > 0 ? changes.join(", ") : "No fields changed";

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        businessName: data.businessName,
        address: data.address,
        notes: data.notes,
        serviceDetails: data.serviceDetails,
        status: data.status,
        value: data.value,
        currency: data.currency,
        activities: {
          create: {
            userEmail: session.user.email,
            action: "Updated Client",
            details: `Updated client details. Changes: ${detailsStr}`,
          },
        },
      },
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

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations";

const getSymbol = (currency: string) => {
  return "₹";
};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
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
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = clientSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    const client = await prisma.client.create({
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
        category: data.category || "Other",
        source: data.source || "Other",
        serviceInterests: data.serviceInterests || "[]",
        status: data.status || "New Prospect",
        address: data.address || null,
        notes: data.notes || null,
        serviceDetails: data.serviceDetails || null,

        // Financials
        value: data.value || 0,
        currency: data.currency || "INR",
        dealValue: data.dealValue || 0,
        advanceAmount: data.advanceAmount || 0,
        balanceAmount: data.balanceAmount || 0,
        paymentStatus: data.paymentStatus || "Pending",
        invoiceStatus: data.invoiceStatus || "Draft",
        gstRequired: data.gstRequired ?? false,
        collectionDate: data.collectionDate ? new Date(data.collectionDate) : null,
        expectedBalanceDate: data.expectedBalanceDate ? new Date(data.expectedBalanceDate) : null,
        dealOwnerEmail: data.dealOwnerEmail || session.user.email,
        incentiveEligible: data.incentiveEligible ?? false,
        dealStatus: data.dealStatus || null,

        // Score
        score: data.score || 0,
        temperature: data.temperature || "Cold",
        lostReason: data.lostReason || null,

        // Conversion / Onboarding
        isConvertedClient: data.isConvertedClient ?? false,
        clientStartDate: data.clientStartDate ? new Date(data.clientStartDate) : null,
        projectManager: data.projectManager || null,
        projectStatus: data.projectStatus || null,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        onboardingChecklist: data.onboardingChecklist || "{}",

        activities: {
          create: {
            userEmail: session.user.email,
            action: "Created Lead",
            details: `Created lead record for ${data.name} (${data.businessName}) via ${data.source || 'N/A'}.`,
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

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

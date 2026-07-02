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
          take: 10,
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
            action: "Created Client",
            details: `Created client record for ${data.name} (${data.businessName}) with value ${getSymbol(data.currency)}${data.value.toLocaleString()}`,
          },
        },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

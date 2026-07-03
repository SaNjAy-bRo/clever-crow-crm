import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bdmEmail = searchParams.get("bdmEmail");

    const where: any = {};
    if (bdmEmail) {
      where.bdmEmail = bdmEmail.toLowerCase();
    }

    const checkIns = await prisma.checkIn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            name: true,
            businessName: true,
          }
        }
      }
    });

    return NextResponse.json(checkIns);
  } catch (error) {
    console.error("Error fetching checkins:", error);
    return NextResponse.json({ error: "Failed to fetch checkins" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, lat, lng, address, notes, photoUrl } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        clientId,
        bdmEmail: session.user.email.toLowerCase(),
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        address: address || null,
        notes: notes || "",
        photoUrl: photoUrl || null,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        clientId,
        userEmail: session.user.email,
        action: "Field Visit Check-In",
        details: `BDM Checked-in at location: ${address || `coordinates [${lat}, ${lng}]`}. Notes: ${notes || "None"}.`,
      }
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error("Error creating checkin:", error);
    return NextResponse.json({ error: "Failed to create checkin" }, { status: 500 });
  }
}

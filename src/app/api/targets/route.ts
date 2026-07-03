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
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    // Check role of current user
    const dbUser = await prisma.whitelist.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });
    const role = dbUser?.role || "user";

    let targets;
    if (role === "admin" || role === "manager") {
      targets = await prisma.target.findMany({
        where: { month, year }
      });
    } else {
      targets = await prisma.target.findMany({
        where: {
          bdmEmail: session.user.email.toLowerCase(),
          month,
          year
        }
      });
    }

    return NextResponse.json(targets);
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json({ error: "Failed to fetch targets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Restrict to admin or manager
  const dbUser = await prisma.whitelist.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });
  const role = dbUser?.role || "user";
  if (role !== "admin" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden: Admins and Managers only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { bdmEmail, month, year, revenueTarget, prospectTarget, callTarget, meetingTarget, proposalTarget, collectionTarget } = body;

    if (!bdmEmail || !month || !year) {
      return NextResponse.json({ error: "Missing required fields: bdmEmail, month, year" }, { status: 400 });
    }

    const emailLower = bdmEmail.toLowerCase();

    const target = await prisma.target.upsert({
      where: {
        bdmEmail_month_year: {
          bdmEmail: emailLower,
          month: parseInt(month),
          year: parseInt(year),
        }
      },
      update: {
        revenueTarget: parseFloat(revenueTarget) || 0,
        prospectTarget: parseInt(prospectTarget) || 0,
        callTarget: parseInt(callTarget) || 0,
        meetingTarget: parseInt(meetingTarget) || 0,
        proposalTarget: parseInt(proposalTarget) || 0,
        collectionTarget: parseFloat(collectionTarget) || 0,
      },
      create: {
        bdmEmail: emailLower,
        month: parseInt(month),
        year: parseInt(year),
        revenueTarget: parseFloat(revenueTarget) || 0,
        prospectTarget: parseInt(prospectTarget) || 0,
        callTarget: parseInt(callTarget) || 0,
        meetingTarget: parseInt(meetingTarget) || 0,
        proposalTarget: parseInt(proposalTarget) || 0,
        collectionTarget: parseFloat(collectionTarget) || 0,
      }
    });

    // Log target change
    await prisma.activityLog.create({
      data: {
        userEmail: session.user.email,
        action: "Target Setup",
        details: `Assigned monthly targets for ${emailLower} for ${month}/${year}.`,
      }
    });

    return NextResponse.json(target);
  } catch (error) {
    console.error("Error setting targets:", error);
    return NextResponse.json({ error: "Failed to set targets" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid leads data format" }, { status: 400 });
    }

    let createdCount = 0;
    let duplicateCount = 0;
    const duplicateList: string[] = [];

    for (const lead of leads) {
      const name = lead.name || "";
      const businessName = lead.businessName || "";
      const phoneNumber = lead.phoneNumber ? String(lead.phoneNumber).trim() : "";
      const email = lead.email ? String(lead.email).toLowerCase().trim() : "";

      if (!name || !businessName || !phoneNumber) {
        continue;
      }

      // Check for duplicates by phone or email
      const existing = await prisma.client.findFirst({
        where: {
          OR: [
            { phoneNumber },
            ...(email ? [{ email }] : [])
          ]
        }
      });

      if (existing) {
        duplicateCount++;
        duplicateList.push(`${businessName} (${phoneNumber})`);
        continue;
      }

      // Create new lead
      await prisma.client.create({
        data: {
          name,
          businessName,
          phoneNumber,
          email: email || null,
          whatsappNumber: lead.whatsappNumber ? String(lead.whatsappNumber).trim() : null,
          website: lead.website || null,
          instagram: lead.instagram || null,
          googleMap: lead.googleMap || null,
          city: lead.city || null,
          area: lead.area || null,
          industry: lead.industry || null,
          category: lead.category || "Other",
          source: lead.source || "Google Maps",
          serviceInterests: lead.serviceInterests || "[]",
          status: lead.status || "New Prospect",
          address: lead.address || "",
          notes: lead.notes || "",
          serviceDetails: lead.serviceDetails || "",
          value: parseFloat(lead.value) || 0,
          currency: lead.currency || "INR",
          dealValue: parseFloat(lead.dealValue) || parseFloat(lead.value) || 0,
          dealOwnerEmail: lead.dealOwnerEmail || session.user.email,
        }
      });

      createdCount++;
    }

    // Log this bulk import event
    await prisma.activityLog.create({
      data: {
        userEmail: session.user.email,
        action: "Bulk Import",
        details: `Imported leads in bulk. Created: ${createdCount}, Skipped: ${duplicateCount}.`,
      }
    });

    return NextResponse.json({
      success: true,
      createdCount,
      duplicateCount,
      duplicates: duplicateList
    });

  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

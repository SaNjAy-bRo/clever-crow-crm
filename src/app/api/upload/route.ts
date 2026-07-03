import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("clientId") as string;
    const type = formData.get("type") as string; // Brief, Proposal PDF, Quotation, Agreement, Brand assets, Website references, Payment screenshot, Meeting notes, Requirement document

    if (!file || !clientId || !type) {
      return NextResponse.json({ error: "Missing parameters: file, clientId, or type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create target directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique name
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Write file
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    // Create Attachment record
    const attachment = await prisma.attachment.create({
      data: {
        clientId,
        name: file.name,
        type,
        url: fileUrl,
        uploadedBy: session.user.email,
      }
    });

    // If it's a Proposal PDF, sync it to the client's latest proposal details
    if (type === "Proposal PDF") {
      const latestProposal = await prisma.proposal.findFirst({
        where: { clientId },
        orderBy: { createdAt: "desc" }
      });
      if (latestProposal) {
        await prisma.proposal.update({
          where: { id: latestProposal.id },
          data: { filePath: fileUrl }
        });
      }
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        clientId,
        userEmail: session.user.email,
        action: "File Uploaded",
        details: `Uploaded ${type}: "${file.name}"`,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Error in file upload route:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}

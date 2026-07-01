import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Secure route check: If not logged in, redirect to login page
  if (!session || !session.user || !session.user.email) {
    redirect("/");
  }

  // Fetch initial data from database
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      client: {
        select: {
          name: true,
          businessName: true,
        },
      },
    },
  });

  const whitelist = await prisma.whitelist.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Safely serialize Prisma Dates to JSON-compatible strings
  const serializedClients = clients.map((client: any) => ({
    ...client,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    activities: client.activities?.map((act: any) => ({
      ...act,
      createdAt: act.createdAt.toISOString(),
    })),
  }));

  const serializedActivities = activities.map((log: any) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  const serializedWhitelist = whitelist.map((entry: any) => ({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  }));

  // Fetch user role from Whitelist database
  const dbUser = await prisma.whitelist.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  // If for some reason the user logged in but is no longer in the whitelist database, reject
  if (!dbUser) {
    redirect("/?error=AccessDenied");
  }

  return (
    <DashboardClient
      initialClients={serializedClients}
      initialActivities={serializedActivities}
      initialWhitelist={serializedWhitelist}
      currentUserEmail={session.user.email}
      currentUserRole={dbUser.role}
      currentUserName={session.user.name || dbUser.name}
    />
  );
}

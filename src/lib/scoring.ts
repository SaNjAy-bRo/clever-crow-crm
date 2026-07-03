import { prisma } from "@/lib/prisma";

export async function updateLeadScoreAndTemp(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        meetings: true,
        proposals: true,
        followUps: true,
      }
    });

    if (!client) return;

    let score = 0;

    // 1. Has budget (+20) - checking if dealValue > 0 or value > 0, or client has budget details in meetings
    const hasBudget = client.dealValue > 0 || client.value > 0 || client.meetings.some(m => m.budgetIdea && m.budgetIdea.trim().length > 0);
    if (hasBudget) {
      score += 20;
    }

    // 2. Decision maker spoken (+20) - checking if decisionMaker is logged in meetings
    const spokenToDecisionMaker = client.meetings.some(m => {
      const dm = m.decisionMaker?.toLowerCase() || "";
      return dm.includes("yes") || dm.trim().length > 2;
    });
    if (spokenToDecisionMaker) {
      score += 20;
    }

    // 3. Meeting completed (+20)
    const hasCompletedMeeting = client.meetings.some(m => m.status === "Completed");
    if (hasCompletedMeeting) {
      score += 20;
    }

    // 4. Needs service urgently (+15) - checking if urgency is logged as High, Immediate, or Yes
    const isUrgent = client.meetings.some(m => {
      const u = m.urgency?.toLowerCase() || "";
      return u.includes("high") || u.includes("immediate") || u.includes("urgent") || u.includes("yes");
    });
    if (isUrgent) {
      score += 15;
    }

    // 5. Already using ads / website (+10) - check if links are filled
    const hasPresence = (client.website && client.website.trim().length > 4) || (client.instagram && client.instagram.trim().length > 4);
    if (hasPresence) {
      score += 10;
    }

    // 6. Asked for proposal (+15)
    const askedForProposal = client.proposals.length > 0 || client.meetings.some(m => m.proposalRequired);
    if (askedForProposal) {
      score += 15;
    }

    // 7. No response for 15 days (-20)
    // Find last activity time or last update. If more than 15 days ago and not closed, deduct.
    const lastInteractionDate = client.updatedAt;
    const daysSinceLastInteraction = (Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 3600 * 24);
    if (daysSinceLastInteraction > 15) {
      score -= 20;
    }

    // Determine lead temperature
    let temperature = "Cold";
    if (score >= 50) {
      temperature = "Hot";
    } else if (score >= 20) {
      temperature = "Warm";
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        score,
        temperature,
      }
    });

  } catch (error) {
    console.error("Error in updateLeadScoreAndTemp:", error);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

const ADMIN_ROLES = new Set([
  "SUPERADMIN",
  "QUALITY_OFFICER",
  "SECRETARY",
  "STUDENT_MANAGER",
]);
const MESSAGING_ADMIN_ROLES = new Set(["SUPERADMIN", "STUDENT_MANAGER"]);

const STUDENT_DECISION_STATUSES = [
  "REJECTED",
  "ACCEPTED",
  "JW202_RECEIVED",
  "VISA_GRANTED",
  "FLIGHT_BOOKED",
  "COMPLETED",
] as const;

type UnreadOptions = {
  onlyStudentSenders?: boolean;
  excludeStudentSenders?: boolean;
};

async function getUnreadCountForUser(userId: string, options: UnreadOptions = {}) {
  const convs = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastRead: true },
  });

  let unreadCount = 0;
  let latestUnreadAt: Date | null = null;

  for (const conv of convs) {
    const where: any = {
      conversationId: conv.conversationId,
      senderId: { not: userId },
      createdAt: { gt: conv.lastRead },
    };

    if (options.onlyStudentSenders) {
      where.sender = { role: { name: "STUDENT" } };
    } else if (options.excludeStudentSenders) {
      where.sender = { role: { name: { not: "STUDENT" } } };
    }

    const [count, latest] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    unreadCount += count;
    if (latest?.createdAt && (!latestUnreadAt || latest.createdAt > latestUnreadAt)) {
      latestUnreadAt = latest.createdAt;
    }
  }

  return { unreadCount, latestUnreadAt };
}

export async function GET() {
  try {
    const session = await authService.getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const now = Date.now();
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const isAdmin = ADMIN_ROLES.has(user.role.name);

    if (isAdmin) {
      const canSeeMessaging = MESSAGING_ADMIN_ROLES.has(user.role.name);
      const [unreadStudentMsgs, pendingDocuments, studentApplicationUpdates] = await Promise.all([
        canSeeMessaging
          ? getUnreadCountForUser(user.id, { onlyStudentSenders: true })
          : Promise.resolve({ unreadCount: 0, latestUnreadAt: null }),
        prisma.document.count({
          where: {
            status: "PENDING",
            updatedAt: { gte: since },
            application: { user: { role: { name: "STUDENT" } } },
          },
        }),
        prisma.application.count({
          where: {
            updatedAt: { gte: since },
            user: { role: { name: "STUDENT" } },
            status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
          },
        }),
      ]);

      const total =
        unreadStudentMsgs.unreadCount + pendingDocuments + studentApplicationUpdates;

      return NextResponse.json({
        role: "ADMIN",
        total,
        unreadMessages: unreadStudentMsgs.unreadCount,
        categories: {
          newStudentMessages: unreadStudentMsgs.unreadCount,
          newStudentDocuments: pendingDocuments,
          studentApplicationUpdates,
        },
        latestAt: unreadStudentMsgs.latestUnreadAt?.toISOString() ?? null,
      });
    }

    const [unreadAdminMsgs, decisionDocuments, decisionApplications, newReceipts] = await Promise.all([
      getUnreadCountForUser(user.id, { excludeStudentSenders: true }),
      prisma.document.count({
        where: {
          application: { userId: user.id },
          status: { in: ["APPROVED", "REJECTED"] },
          updatedAt: { gte: since },
        },
      }),
      prisma.application.count({
        where: {
          userId: user.id,
          status: { in: STUDENT_DECISION_STATUSES as any },
          updatedAt: { gte: since },
        },
      }),
      prisma.activityLog.count({
        where: {
          action: "RECEIPT_GENERATED",
          targetType: "RECEIPT",
          targetId: user.id,
          createdAt: { gte: since },
        },
      }),
    ]);

    const total = unreadAdminMsgs.unreadCount + decisionDocuments + decisionApplications + newReceipts;

    return NextResponse.json({
      role: "STUDENT",
      total,
      unreadMessages: unreadAdminMsgs.unreadCount,
      categories: {
        messagesFromAdmin: unreadAdminMsgs.unreadCount,
        documentDecisions: decisionDocuments,
        applicationDecisions: decisionApplications,
        newReceipts,
      },
      latestAt: unreadAdminMsgs.latestUnreadAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("GET /api/notifications/summary error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

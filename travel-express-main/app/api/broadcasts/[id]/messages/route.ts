import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { authService } from "@/services/auth.service";

type AuthenticatedUser = {
  id: string;
  roleName: string;
  isAdmin: boolean;
};

async function authenticateRequester(req: NextRequest): Promise<AuthenticatedUser | null> {
  // Prefer server session cookie first to avoid stale localStorage token conflicts.
  const session = await authService.getSession(req);
  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (user) {
      const roleName = user.role?.name || "STUDENT";
      return {
        id: user.id,
        roleName,
        isAdmin: roleName === "SUPERADMIN" || roleName === "SECRETARY",
      };
    }
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const tokenPayload = verifyToken(authHeader);
  if (!tokenPayload?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.id },
    select: { id: true, role: { select: { name: true } } },
  });
  if (!user) return null;

  const roleName = user.role?.name || "STUDENT";
  return {
    id: user.id,
    roleName,
    isAdmin: roleName === "SUPERADMIN" || roleName === "SECRETARY",
  };
}

/**
 * GET /api/broadcasts/[id]/messages
 * Récupère les messages d'une diffusion
 * (Créateur ou admins uniquement)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;
    const requester = await authenticateRequester(req);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = requester.id;
    const isAdmin = requester.isAdmin;

    const broadcast = await prisma.broadcast.findUnique({
      where: { id: broadcastId },
      select: {
        id: true,
        createdBy: true,
        recipients: { select: { userId: true } },
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const isCreator = broadcast.createdBy === userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { broadcastId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("❌ Erreur GET /api/broadcasts/[id]/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/broadcasts/[id]/messages
 * Envoie un message dans une diffusion
 * (Créateur ou admins)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;
    const requester = await authenticateRequester(req);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = requester.id;
    const isAdmin = requester.isAdmin;

    const broadcast = await prisma.broadcast.findUnique({
      where: { id: broadcastId },
      select: {
        id: true,
        createdBy: true,
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    if (broadcast.createdBy !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - only creator or admin can post" },
        { status: 403 }
      );
    }

    const { content, attachments = [] } = await req.json();
    const hasContent = typeof content === "string" && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const safeContent = hasContent ? content.trim() : "";
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    const message = await prisma.$transaction(async (tx) => {
      // 1) Garder une trace dans la diffusion (historique côté admin)
      const broadcastMessage = await tx.message.create({
        data: {
          broadcastId,
          senderId: userId,
          content: safeContent,
          attachments: safeAttachments,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
      });

      // 2) Fan-out : pousser le même message dans la discussion directe de chaque destinataire
      const recipients = await tx.broadcastRecipient.findMany({
        where: { broadcastId },
        select: { userId: true },
      });

      for (const recipient of recipients) {
        const recipientId = recipient.userId;
        if (recipientId === userId) continue;

        let conversation = await tx.conversation.findFirst({
          where: {
            applicationId: null,
            AND: [
              { participants: { some: { userId } } },
              { participants: { some: { userId: recipientId } } },
              {
                participants: {
                  every: {
                    OR: [{ userId }, { userId: recipientId }],
                  },
                },
              },
            ],
          },
          select: { id: true },
        });

        if (!conversation) { 
          conversation = await tx.conversation.create({ 
            data: { 
              subject: null, 
              participants: { 
                create: [{ userId }, { userId: recipientId }], 
              }, 
            }, 
            select: { id: true },
          });
        }

        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: safeContent,
            attachments: safeAttachments,
          },
        });
      }

      return broadcastMessage;
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("❌ Erreur POST /api/broadcasts/[id]/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

/**
 * POST /api/student/messages/[applicationId]/mark-read
 * Marque tous les messages de la conversation comme lus
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const userId = await authService.getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'application appartient à l'étudiant
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { userId: true }
    });

    if (!application || application.userId !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { applicationId },
      include: { messages: true }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Créer des ReadReceipts pour tous les messages non-propres
    const otherMessages = conversation.messages.filter(
      (msg) => msg.senderId !== userId
    );

    for (const msg of otherMessages) {
      await prisma.readReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: msg.id,
            userId: userId,
          },
        },
        update: { readAt: new Date() },
        create: {
          messageId: msg.id,
          userId: userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      markedCount: otherMessages.length,
    });
  } catch (error) {
    console.error("[MARK_READ]", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage" },
      { status: 500 }
    );
  }
}

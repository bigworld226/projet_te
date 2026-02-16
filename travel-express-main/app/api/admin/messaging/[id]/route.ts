import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

/**
 * GET /api/admin/messaging/[id]
 * Récupère une conversation complète avec tous les messages
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminWithPermission(["MANAGE_DISCUSSIONS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            country: true,
            desiredProgram: true,
            user: { select: { id: true, fullName: true, email: true } },
            university: { select: { name: true, city: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: { select: { name: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Tous les admins avec MANAGE_DISCUSSIONS peuvent voir le détail
    // Mettre à jour le lastRead du participant si applicable
    const isParticipant = conversation.participants.some(p => p.userId === admin.id);
    if (isParticipant) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, userId: admin.id },
        data: { lastRead: new Date() },
      });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("[MESSAGING_DETAIL_GET]", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

/**
 * POST /api/admin/messaging/[id]
 * Envoie un nouveau message dans la conversation
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminWithPermission(["MANAGE_DISCUSSIONS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { content, attachments = [] } = body;
    const hasContent = typeof content === "string" && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return NextResponse.json({ error: "Contenu du message requis" }, { status: 400 });
    }

    // Vérifier que la conversation existe et que l'admin y participe
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Tous les admins avec MANAGE_DISCUSSIONS peuvent envoyer un message
    const isParticipant = conversation.participants.some(p => p.userId === admin.id);
    if (!isParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: id, userId: admin.id },
      });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: admin.id,
        content: hasContent ? content.trim() : "",
        attachments: Array.isArray(attachments) ? attachments : [],
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: { select: { name: true } } },
        },
      },
    });

    // Mettre à jour le updatedAt de la conversation
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[MESSAGING_SEND]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/messaging/[id]
 * Supprime une conversation (admin uniquement)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminWithPermission(["MANAGE_DISCUSSIONS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Supprimer tous les messages d'abord
    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    // Supprimer tous les participants
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: id },
    });

    // Supprimer la conversation
    await prisma.conversation.delete({
      where: { id },
    });

    console.log(`✅ Conversation ${id} supprimée par ${admin.email}`);

    return NextResponse.json({ message: "Conversation supprimée avec succès" });
  } catch (error) {
    console.error("[MESSAGING_DELETE]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}



import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET(req: any, context: any) {
  const admin = await requireAdminWithPermission(["MANAGE_STUDENTS", "VIEW_STUDENTS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const params = await context.params;
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { name: true } },
        passportNumber: true,
        specificDiseases: true,
        applications: {
          include: {
            university: {
              select: { name: true, city: true }
            },
            payments: true,
            _count: {
              select: { documents: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          where: { applicationId: null },
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!user || user.role.name !== "STUDENT") {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET_STUDENT_DETAIL_ERROR]", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'étudiant" }, { status: 500 });
  }
}

export async function DELETE(req: any, context: any) {
  // Seul MANAGE_STUDENTS peut supprimer
  const adminDel = await requireAdminWithPermission(["MANAGE_STUDENTS"]);
  if (!adminDel) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const params = await context.params;
    const { id } = params;

    // Suppression en cascade manuelle (pour éviter les erreurs de clés étrangères)
    await prisma.$transaction(async (tx) => {
      // 1. Récupérer les IDs des applications
      const apps = await tx.application.findMany({ 
        where: { userId: id }, 
        select: { id: true } 
      });
      const appIds = apps.map(app => app.id);

      // 2. Supprimer les documents (y compris ceux vérifiés par cet user)
      if (appIds.length > 0) {
        // Supprimer les conversations liées aux applications
        const conversations = await tx.conversation.findMany({
          where: { applicationId: { in: appIds } },
          select: { id: true }
        });
        const convIds = conversations.map(c => c.id);
        if (convIds.length > 0) {
          await tx.message.deleteMany({ where: { conversationId: { in: convIds } } });
          await tx.conversationParticipant.deleteMany({ where: { conversationId: { in: convIds } } });
          await tx.conversation.deleteMany({ where: { id: { in: convIds } } });
        }
        await tx.document.deleteMany({ where: { applicationId: { in: appIds } } });
      }

      // 3. Supprimer les messages envoyés par l'user
      await tx.message.deleteMany({ where: { senderId: id } });

      // 4. Supprimer les participations aux conversations
      await tx.conversationParticipant.deleteMany({ where: { userId: id } });

      // 5. Supprimer les vérifications de documents (mettre à null)
      await tx.document.updateMany({ where: { verifiedById: id }, data: { verifiedById: null } });

      // 6. Supprimer les paiements (liés à l'user)
      await tx.payment.deleteMany({ where: { userId: id } });

      // 7. Supprimer les logs d'activité
      await tx.activityLog.deleteMany({ where: { adminId: id } });

      // 8. Supprimer les applications
      await tx.application.deleteMany({ where: { userId: id } });

      // 9. Supprimer l'utilisateur
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE_STUDENT_ERROR]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
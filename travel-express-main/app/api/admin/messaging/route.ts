import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";
import { verifyToken } from "@/lib/jwt";
import { corsHeaders } from "@/lib/cors";

/**
 * GET /api/admin/messaging
 * Liste toutes les conversations auxquelles l'admin participe
 * (ou toutes si SUPERADMIN)
 */
export async function GET(req: NextRequest) {
  // Vérifier JWT token
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const tokenPayload = verifyToken(authHeader);
    if (!tokenPayload) {
      return NextResponse.json(
        { message: "Token invalide ou expiré" },
        { status: 401, headers: corsHeaders }
      );
    }
    // Si JWT sont fourni, vérifier dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.id || (tokenPayload as any).userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user || user.role.name === "STUDENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403, headers: corsHeaders });
    }

    // Si admin, continuer avec les données JWT (pas de permission check pour le rollback)
  } else {
    // Sinon, utiliser l'authentification par session
    const admin = await requireAdminWithPermission(["MANAGE_DISCUSSIONS"]);
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403, headers: corsHeaders }
      );
    }
  }


  try {
    // Tous les admins avec MANAGE_DISCUSSIONS voient toutes les conversations
    const conversations = await prisma.conversation.findMany({
      include: {
        application: {
          select: {
            id: true,
            status: true,
            user: { select: { id: true, fullName: true, email: true } },
            university: { select: { name: true } },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: { select: { name: true } } } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Dernier message pour l'aperçu
          include: {
            sender: { select: { fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Formater pour le frontend
    const formatted = conversations.map((conv) => ({
      id: conv.id,
      subject: conv.subject || (conv.application ? `Dossier de ${conv.application.user?.fullName}` : "Discussion"),
      applicationId: conv.applicationId,
      studentName: conv.application?.user?.fullName || "N/A",
      studentEmail: conv.application?.user?.email || "",
      universityName: conv.application?.university?.name || "",
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        role: p.user.role.name,
      })),
      lastMessage: conv.messages[0]
        ? {
            content: conv.messages[0].content.substring(0, 100),
            sender: conv.messages[0].sender.fullName,
            date: conv.messages[0].createdAt,
          }
        : null,
      updatedAt: conv.updatedAt,
    }));

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error("[MESSAGING_GET]", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * POST /api/admin/messaging
 * Crée une nouvelle conversation
 */
export async function POST(req: NextRequest) {
  // Vérifier JWT token
  const authHeader = req.headers.get("authorization");
  let adminId: string | null = null;

  if (authHeader) {
    const tokenPayload = verifyToken(authHeader);
    if (!tokenPayload) {
      return NextResponse.json(
        { message: "Token invalide ou expiré" },
        { status: 401, headers: corsHeaders }
      );
    }
    // Si JWT est fourni, vérifier dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.id || (tokenPayload as any).userId },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user || user.role.name === "STUDENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403, headers: corsHeaders });
    }
    adminId = user.id;
  } else {
    // Sinon, utiliser l'authentification par session
    const admin = await requireAdminWithPermission(["MANAGE_DISCUSSIONS"]);
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403, headers: corsHeaders }
      );
    }
    adminId = admin.id;
  }

  try {
    const body = await req.json();
    const { applicationId, subject, participantIds, initialMessage } = body;

    if (!initialMessage) {
      return NextResponse.json({ error: "Message initial requis" }, { status: 400, headers: corsHeaders });
    }

    // On inclut toujours l'admin créateur dans les participants
    const allParticipantIds = new Set<string>([adminId, ...(participantIds || [])]);

    // Si lié à une application, ajouter l'étudiant
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { userId: true },
      });
      if (app) allParticipantIds.add(app.userId);
    }

    const conversation = await prisma.conversation.create({
      data: {
        applicationId: applicationId || null,
        subject: subject || null,
        participants: {
          create: Array.from(allParticipantIds).map((userId) => ({
            userId,
          })),
        },
        messages: {
          create: {
            senderId: adminId,
            content: initialMessage,
            attachments: [],
          },
        },
      },
      include: {
        participants: {
          include: { user: { select: { fullName: true } } },
        },
        messages: {
          include: { sender: { select: { fullName: true } } },
        },
      },
    });

    return NextResponse.json({ conversation }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("[MESSAGING_POST]", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500, headers: corsHeaders });
  }
}

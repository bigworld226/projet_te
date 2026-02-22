import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

// CORS Headers Helper
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * GET /api/student/groups/[groupId]/messages
 * Récupère tous les messages d'un groupe
 * (Admin ou membres du groupe)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await authService.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers: corsHeaders });
    }

    const { groupId } = await params;

    // Récupérer l'utilisateur complet pour vérifier le rôle
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } }
    });

    const isAdmin = user?.role?.name === 'SUPERADMIN' || user?.role?.name === 'STUDENT_MANAGER';

    // Vérifier que l'utilisateur est admin OU fait partie du groupe
    if (!isAdmin) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId: session.userId,
        }
      });

      if (!membership) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403, headers: corsHeaders });
      }
    }

    // Récupérer les messages du groupe
    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: {
          select: { id: true, fullName: true, profileImage: true }
        },
        readReceipts: {
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ messages }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: corsHeaders });
  }
}

/**
 * POST /api/student/groups/[groupId]/messages
 * Envoie un message dans un groupe
 * (Admin ou membres du groupe)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await authService.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers: corsHeaders });
    }

    const { groupId } = await params;
    const { content, attachments = [] } = await req.json();
    const hasContent = typeof content === "string" && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400, headers: corsHeaders });
    }

    // Récupérer l'utilisateur pour vérifier le rôle
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } }
    });

    const isAdmin = user?.role?.name === 'SUPERADMIN' || user?.role?.name === 'STUDENT_MANAGER';

    // Vérifier que l'utilisateur est admin OU fait partie du groupe
    if (!isAdmin) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId: session.userId,
        }
      });

      if (!membership) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403, headers: corsHeaders });
      }
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        content: hasContent ? content.trim() : "",
        attachments: Array.isArray(attachments) ? attachments : [],
        senderId: session.userId,
        groupId
      },
      include: {
        sender: {
          select: { id: true, fullName: true, profileImage: true }
        },
        readReceipts: {
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ message }, { 
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Error creating group message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: corsHeaders });
  }
}



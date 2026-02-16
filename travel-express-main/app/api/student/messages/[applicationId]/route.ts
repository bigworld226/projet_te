import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

/**
 * GET /api/student/messages/[applicationId]
 * Récupère la conversation liée au dossier de l'étudiant
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const userId = await authService.getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { applicationId } = await params;

    // Vérifier que l'application appartient à l'étudiant
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { userId: true }
    });

    if (!application || application.userId !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer ou créer la conversation
    let conversation = await prisma.conversation.findUnique({
      where: { applicationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: { select: { name: true } }
              }
            },
            readReceipts: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true
                  }
                }
              }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    // Si pas de conversation, la créer
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          applicationId,
          subject: "Discussion sur mon dossier",
          participants: {
            create: {
              userId: userId
            }
          }
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  role: { select: { name: true } }
                }
              },
              readReceipts: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true
                    }
                  }
                }
              }
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  role: { select: { name: true } }
                }
              }
            }
          }
        }
      });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("[STUDENT_MESSAGES_GET]", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

/**
 * POST /api/student/messages/[applicationId]
 * Envoie un nouveau message dans la conversation
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const userId = await authService.getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { applicationId } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });
    }

    // Vérifier que l'application appartient à l'étudiant
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { userId: true }
    });

    if (!application || application.userId !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer ou créer la conversation
    let conversation = await prisma.conversation.findUnique({
      where: { applicationId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          applicationId,
          subject: "Discussion sur mon dossier",
          participants: {
            create: {
              userId: userId
            }
          }
        }
      });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } }
          }
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error("[STUDENT_MESSAGES_POST]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}

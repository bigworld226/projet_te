import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hasPermission } from "@/lib/jwt";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

// GET: Lister les conversations de l'utilisateur
export async function GET(req: NextRequest) {
    try {
        // Vérifier le JWT token
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ message: "Authorization header manquant" }, { status: 401, headers: corsHeaders });
        }

        const tokenPayload = verifyToken(authHeader);
        if (!tokenPayload) {
            return NextResponse.json({ message: "Token invalide ou expiré" }, { status: 401, headers: corsHeaders });
        }

        // Vérifier les permissions
        if (!hasPermission(tokenPayload, "CONVERSATION.READ")) {
            return NextResponse.json({ message: "Accès refusé" }, { status: 403, headers: corsHeaders });
        }

        console.log(`✅ Accès /api/conversations autorisé pour ${tokenPayload.email} (${tokenPayload.role.name})`);

        // Récupérer les conversations selon le rôle
        let conversations;
        
        if (tokenPayload.role.name === "SUPERADMIN" || tokenPayload.role.name === "SECRETARY") {
            // Admin voit toutes les conversations
            conversations = await prisma.conversation.findMany({
                include: {
                    participants: {
                        include: { user: true }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                }
            });
        } else {
            // Les autres utilisateurs ne voient que leurs conversations
            conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        some: { userId: tokenPayload.id }
                    }
                },
                include: {
                    participants: {
                        include: { user: true }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                }
            });
        }

        return NextResponse.json(conversations, { headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur /api/conversations:", err);
        return NextResponse.json({ message: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500, headers: corsHeaders });
    }
}

// POST: Créer une nouvelle conversation
export async function POST(req: NextRequest) {
    try {
        // Vérifier le JWT token
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ message: "Authorization header manquant" }, { status: 401, headers: corsHeaders });
        }

        const tokenPayload = verifyToken(authHeader);
        if (!tokenPayload) {
            return NextResponse.json({ message: "Token invalide ou expiré" }, { status: 401, headers: corsHeaders });
        }

        // Vérifier les permissions
        if (!hasPermission(tokenPayload, "CONVERSATION.CREATE")) {
            return NextResponse.json({ message: "Accès refusé - création non autorisée" }, { status: 403, headers: corsHeaders });
        }

        // Récupérer le body
        const body = await req.json();
        const { participantId, subject } = body;

        if (!participantId) {
            return NextResponse.json({ message: "participantId manquant" }, { status: 400, headers: corsHeaders });
        }

        // Vérifier que le participant existe
        const participantExists = await prisma.user.findUnique({
            where: { id: participantId }
        });

        if (!participantExists) {
            return NextResponse.json({ message: "Participant introuvable" }, { status: 404, headers: corsHeaders });
        }

        // Créer la conversation
        const conversation = await prisma.conversation.create({
            data: {
                subject: subject || `Conversation avec ${participantExists.fullName}`,
                participants: {
                    create: [
                        { userId: tokenPayload.id },      // L'utilisateur actuel
                        { userId: participantId }          // Le participant
                    ]
                }
            },
            include: {
                participants: {
                    include: { user: true }
                }
            }
        });

        console.log(`✅ Conversation créée entre ${tokenPayload.email} et ${participantExists.email}`);

        return NextResponse.json(conversation, { status: 201, headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur POST /api/conversations:", err);
        return NextResponse.json(
            { message: err instanceof Error ? err.message : "Erreur serveur" },
            { status: 500, headers: corsHeaders }
        );
    }
}
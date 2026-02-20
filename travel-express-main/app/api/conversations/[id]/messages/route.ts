import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

// GET: Messages d'une conversation
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: conversationId } = await params;

        // Vérifier le JWT token
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json(
                { message: "Authorization header manquant" },
                { status: 401, headers: corsHeaders }
            );
        }

        const tokenPayload = verifyToken(authHeader);
        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Token invalide ou expiré" },
                { status: 401, headers: corsHeaders }
            );
        }

        const userId = tokenPayload.id || (tokenPayload as any).userId;

        // Vérifier le rôle de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: { select: { name: true } } }
        });

        if (!user) {
            return NextResponse.json(
                { message: "Utilisateur non trouvé" },
                { status: 404, headers: corsHeaders }
            );
        }

        // Les étudiants ne peuvent pas accéder à ce endpoint
        // Ils doivent utiliser /api/student/admin/messages à la place
        if (user.role.name === "STUDENT") {
            return NextResponse.json(
                { message: "Accès refusé - Les étudiants doivent utiliser un endpoint dédié" },
                { status: 403, headers: corsHeaders }
            );
        }

        // Vérifier que l'utilisateur (admin) est participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId
            }
        });

        if (!participant) {
            return NextResponse.json(
                { message: "Vous n'êtes pas participant à cette conversation" },
                { status: 403, headers: corsHeaders }
            );
        }

        // Récupérer les messages
        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: { sender: true },
            orderBy: { createdAt: "asc" }
        });

        console.log(
            `✅ ${messages.length} messages récupérés pour conversation ${conversationId}`
        );

        return NextResponse.json(messages, { headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur GET /api/conversations/[id]/messages:", err);
        return NextResponse.json(
            { message: err instanceof Error ? err.message : "Erreur serveur" },
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST: Envoyer un message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: conversationId } = await params;

        // Vérifier le JWT token
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json(
                { message: "Authorization header manquant" },
                { status: 401, headers: corsHeaders }
            );
        }

        const tokenPayload = verifyToken(authHeader);
        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Token invalide ou expiré" },
                { status: 401, headers: corsHeaders }
            );
        }

        const userId = tokenPayload.id || (tokenPayload as any).userId;

        // Vérifier le rôle de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: { select: { name: true } } }
        });

        if (!user) {
            return NextResponse.json(
                { message: "Utilisateur non trouvé" },
                { status: 404, headers: corsHeaders }
            );
        }

        // Les étudiants ne peuvent pas accéder à ce endpoint
        // Ils doivent utiliser /api/student/admin/messages à la place
        if (user.role.name === "STUDENT") {
            return NextResponse.json(
                { message: "Accès refusé - Les étudiants doivent utiliser un endpoint dédié" },
                { status: 403, headers: corsHeaders }
            );
        }

        // Récupérer le body
        const body = await req.json();
        const { content, senderId, attachments = [] } = body;
        const hasContent = typeof content === "string" && content.trim().length > 0;
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

        if (!senderId || (!hasContent && !hasAttachments)) {
            return NextResponse.json(
                { message: "content/senderId obligatoires (ou au moins une pièce jointe)" },
                { status: 400, headers: corsHeaders }
            );
        }

        // Vérifier que la conversation existe
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            return NextResponse.json(
                { message: "Conversation introuvable" },
                { status: 404, headers: corsHeaders }
            );
        }

        // Vérifier que l'utilisateur est participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId
            }
        });

        if (!participant) {
            return NextResponse.json(
                { message: "Vous n'êtes pas participant à cette conversation" },
                { status: 403, headers: corsHeaders }
            );
        }

        // Créer le message
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                content: hasContent ? content.trim() : "",
                attachments: Array.isArray(attachments) ? attachments : []
            },
            include: { sender: true }
        });

        // Mettre à jour le lastRead pour celui qui envoie
        await prisma.conversationParticipant.update({
            where: {
                id: participant.id
            },
            data: {
                lastRead: new Date()
            }
        });

        console.log(
            `✅ Message envoyé dans conversation ${conversationId} par ${tokenPayload.email}`
        );

        return NextResponse.json(message, {
            status: 201,
            headers: corsHeaders
        });
    } catch (err) {
        console.error("❌ Erreur POST /api/conversations/[id]/messages:", err);
        return NextResponse.json(
            { message: err instanceof Error ? err.message : "Erreur serveur" },
            { status: 500, headers: corsHeaders }
        );
    }
}


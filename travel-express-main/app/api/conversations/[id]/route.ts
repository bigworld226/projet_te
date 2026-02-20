import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hasPermission } from "@/lib/jwt";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

// DELETE: Supprimer une conversation
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        // Vérifier les permissions - Admin uniquement
        if (!["SUPERADMIN", "SECRETARY"].includes(tokenPayload.role.name)) {
            return NextResponse.json(
                { message: "Accès refusé - seuls les admins peuvent supprimer" },
                { status: 403, headers: corsHeaders }
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

        // Supprimer tous les messages d'abord
        await prisma.message.deleteMany({
            where: { conversationId }
        });

        // Supprimer tous les participants
        await prisma.conversationParticipant.deleteMany({
            where: { conversationId }
        });

        // Supprimer la conversation
        await prisma.conversation.delete({
            where: { id: conversationId }
        });

        console.log(`✅ Conversation ${conversationId} supprimée par ${tokenPayload.email}`);

        return NextResponse.json(
            { message: "Conversation supprimée avec succès" },
            { headers: corsHeaders }
        );
    } catch (err) {
        console.error("❌ Erreur DELETE /api/conversations/[id]:", err);
        return NextResponse.json(
            { message: err instanceof Error ? err.message : "Erreur serveur" },
            { status: 500, headers: corsHeaders }
        );
    }
}

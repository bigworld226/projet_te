import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: Modifier un message
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { content, editedAt } = body;

        if (!content) {
            return NextResponse.json(
                { message: "Le contenu du message est requis" },
                { status: 400 }
            );
        }

        const updatedMessage = await prisma.message.update({
            where: { id: params.id },
            data: {
                content,
                editedAt: editedAt ? new Date(editedAt) : new Date()
            }
        });

        return NextResponse.json(updatedMessage);
    } catch (err) {
        console.error("❌ Erreur PATCH /api/messages/[id]:", err);
        return NextResponse.json({ message: "Erreur modification" }, { status: 500 });
    }
}

// DELETE: Supprimer un message
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await prisma.message.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ message: "Erreur suppression" }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

type AuthenticatedUser = {
    id: string;
    roleName: string;
    isAdmin: boolean;
};

async function authenticateRequester(req: NextRequest): Promise<AuthenticatedUser | null> {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const decoded = verifyToken(authHeader);
        if (decoded?.id) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, role: { select: { name: true } } },
            });
            if (user) {
                const roleName = user.role?.name || "STUDENT";
                return {
                    id: user.id,
                    roleName,
                    isAdmin: roleName === "SUPERADMIN" || roleName === "STUDENT_MANAGER",
                };
            }
        }
    }

    const session = await authService.getSession(req);
    if (!session?.userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, role: { select: { name: true } } },
    });
    if (!user) return null;
    const roleName = user.role?.name || "STUDENT";
    return {
        id: user.id,
        roleName,
        isAdmin: roleName === "SUPERADMIN" || roleName === "STUDENT_MANAGER",
    };
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: broadcastId } = await params;
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;

        // Récupérer les infos de la diffusion
        const broadcast = await prisma.broadcast.findUnique({
            where: { id: broadcastId },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
                recipients: { select: { userId: true } },
            },
        });

        if (!broadcast) {
            return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
        }

        const canManage = isAdmin || broadcast.createdBy === userId;
        if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const enrichedBroadcast = {
            ...broadcast,
            createdBy: broadcast.createdBy,
            recipients: canManage ? broadcast.recipients : [],
            recipientDetails: canManage
                ? await prisma.user.findMany({
                    where: { id: { in: broadcast.recipients.map((r: any) => r.userId) } },
                    select: { id: true, fullName: true, email: true },
                })
                : [],
            isRecipient: broadcast.recipients.some((r: any) => r.userId === userId),
            canManage,
        };

        return NextResponse.json(enrichedBroadcast, { status: 200 });
    } catch (error) {
        console.error("❌ Erreur GET /api/broadcasts/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: broadcastId } = await params;
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;
        const { recipientIds } = await req.json();

        if (!recipientIds || recipientIds.length === 0) {
            return NextResponse.json({ error: "At least one recipient required" }, { status: 400 });
        }

        // Vérifier que la diffusion existe
        const broadcast = await prisma.broadcast.findUnique({
            where: { id: broadcastId },
            include: { recipients: true },
        });

        if (!broadcast) {
            return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
        }

        // Seul le créateur/admin peut modifier la diffusion
        if (broadcast.createdBy !== userId && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Ajouter les nouveaux destinataires
        const existingRecipientIds = broadcast.recipients.map((r: any) => r.userId);
        const newRecipientIds = recipientIds.filter((id: string) => !existingRecipientIds.includes(id));

        if (newRecipientIds.length === 0) {
            return NextResponse.json({ error: "All recipients already in broadcast" }, { status: 400 });
        }

        await prisma.broadcastRecipient.createMany({
            data: newRecipientIds.map((id: string) => ({
                broadcastId,
                userId: id,
            })),
            skipDuplicates: true,
        });

        // Retourner la diffusion mise à jour avec les enrichissements
        const updatedBroadcast = await prisma.broadcast.findUnique({
            where: { id: broadcastId },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
                recipients: { select: { userId: true } },
            },
        });

        const enrichedBroadcast = updatedBroadcast ? {
            ...updatedBroadcast,
            createdBy: updatedBroadcast.createdBy,
            recipientDetails: await prisma.user.findMany({
                where: { id: { in: updatedBroadcast.recipients.map((r: any) => r.userId) } },
                select: { id: true, fullName: true, email: true },
            }),
            isRecipient: updatedBroadcast.recipients.some((r: any) => r.userId === userId),
            canManage: true,
        } : null;

        return NextResponse.json(enrichedBroadcast, { status: 201 });
    } catch (error) {
        console.error("❌ Erreur POST /api/broadcasts/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: broadcastId } = await params;
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;

        // Vérifier que la diffusion existe et que l'utilisateur est le créateur ou admin
        const broadcast = await prisma.broadcast.findUnique({
            where: { id: broadcastId },
        });

        if (!broadcast) {
            return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
        }

        if (broadcast.createdBy !== userId && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Supprimer la diffusion
        await prisma.broadcast.delete({
            where: { id: broadcastId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur DELETE /api/broadcasts/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

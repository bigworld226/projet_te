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
        const { id: groupId } = await params;
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;

        // Récupérer les infos du groupe
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
                members: { select: { userId: true } },
            },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Enrichir avec les détails des membres
        const enrichedGroup = {
            ...group,
            createdBy: group.createdBy,
            memberDetails: await prisma.user.findMany({
                where: { id: { in: group.members.map((m) => m.userId) } },
                select: { id: true, fullName: true, email: true },
            }),
            isMember: group.members.some((m) => m.userId === userId),
            canManage: isAdmin || group.createdBy === userId,
        };

        return NextResponse.json(enrichedGroup, { status: 200 });
    } catch (error) {
        console.error("❌ Erreur GET /api/groups/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;
        const { memberIds } = await req.json();

        if (!memberIds || memberIds.length === 0) {
            return NextResponse.json({ error: "At least one member required" }, { status: 400 });
        }

        // Vérifier que le groupe existe
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Ajouter les nouveaux membres
        const existingMemberIds = group.members.map((m) => m.userId);
        const newMemberIds = memberIds.filter((id: string) => !existingMemberIds.includes(id));

        if (newMemberIds.length === 0) {
            return NextResponse.json({ error: "All members already in group" }, { status: 400 });
        }

        await prisma.groupMember.createMany({
            data: newMemberIds.map((id: string) => ({
                groupId,
                userId: id,
            })),
            skipDuplicates: true,
        });

        // Retourner le groupe mis à jour avec les enrichissements
        const updatedGroup = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
                members: { select: { userId: true } },
            },
        });

        // Enrichir avec l'info des membres (noms)
        const enrichedGroup = updatedGroup ? {
            ...updatedGroup,
            createdBy: updatedGroup.createdBy,
            memberDetails: await prisma.user.findMany({
                where: { id: { in: updatedGroup.members.map((m) => m.userId) } },
                select: { id: true, fullName: true, email: true },
            }),
            isMember: updatedGroup.members.some((m) => m.userId === userId),
            canManage: isAdmin || updatedGroup.createdBy === userId,
        } : null;

        return NextResponse.json(enrichedGroup, { status: 201 });
    } catch (error) {
        console.error("❌ Erreur POST /api/groups/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;

        // Vérifier que le groupe existe et que l'utilisateur est le créateur ou admin
        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        if (group.createdBy !== userId && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Supprimer le groupe (les membres seront supprimés via onDelete: Cascade)
        await prisma.group.delete({
            where: { id: groupId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur DELETE /api/groups/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

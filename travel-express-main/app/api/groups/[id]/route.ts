import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { getPrimaryUniversityIdForUser, getUniversityIdsForUsers } from "@/lib/university-scope";

type AuthenticatedUser = {
    id: string;
    roleName: string;
    isAdmin: boolean;
    isMentor: boolean;
    universityId: string | null;
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
                    isMentor: roleName === "STUDENT_MENTOR",
                    universityId: await getPrimaryUniversityIdForUser(user.id),
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
        isMentor: roleName === "STUDENT_MENTOR",
        universityId: await getPrimaryUniversityIdForUser(user.id),
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
        const memberDetails = await prisma.user.findMany({
            where: { id: { in: group.members.map((m) => m.userId) } },
            select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
        });
        const mentor = memberDetails.find((m: any) => m.role?.name === "STUDENT_MENTOR");
        const enrichedGroup = {
            ...group,
            createdBy: group.createdBy,
            memberDetails,
            mentorName: mentor?.fullName || null,
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

        if (requester.isMentor && !requester.universityId) {
            return NextResponse.json(
                { error: "Student Mentor sans université affectée." },
                { status: 400 }
            );
        }

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
        let newMemberIds = memberIds.filter((id: string) => !existingMemberIds.includes(id));

        if (newMemberIds.length === 0) {
            return NextResponse.json({ error: "All members already in group" }, { status: 400 });
        }

        if (requester.isMentor) {
            const scopeIds = Array.from(new Set([userId, ...newMemberIds]));
            const scopedUsers = await prisma.user.findMany({
                where: { id: { in: scopeIds } },
                select: { id: true, role: { select: { name: true } } },
            });
            const universityByUser = await getUniversityIdsForUsers(scopeIds);
            const allowedIds = new Set(
                scopedUsers
                    .filter((u) => ["STUDENT", "STUDENT_MENTOR"].includes(u.role.name))
                    .filter((u) => universityByUser.get(u.id) === requester.universityId)
                    .map((u) => u.id)
            );
            const invalid = scopeIds.filter((id) => !allowedIds.has(id));
            if (invalid.length > 0) {
                return NextResponse.json(
                    { error: "Tous les membres ajoutés doivent être de la même université que le mentor." },
                    { status: 403 }
                );
            }
            newMemberIds = newMemberIds.filter((id: string) => allowedIds.has(id));
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
        const enrichedGroup = updatedGroup ? (() => {
            const detailsPromise = prisma.user.findMany({
                where: { id: { in: updatedGroup.members.map((m) => m.userId) } },
                select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
            });
            return detailsPromise.then((memberDetails) => {
                const mentor = memberDetails.find((m: any) => m.role?.name === "STUDENT_MENTOR");
                return {
                    ...updatedGroup,
                    createdBy: updatedGroup.createdBy,
                    memberDetails,
                    mentorName: mentor?.fullName || null,
                    isMember: updatedGroup.members.some((m) => m.userId === userId),
                    canManage: isAdmin || updatedGroup.createdBy === userId,
                };
            });
        })() : null;

        return NextResponse.json(await enrichedGroup, { status: 201 });
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

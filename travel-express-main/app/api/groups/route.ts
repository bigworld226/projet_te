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

export async function GET(req: NextRequest) {
    try {
        const requester = await authenticateRequester(req);
        if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = requester.id;
        const isAdmin = requester.isAdmin;

        // Récupérer tous les groupes (admins voient tous, autres uniquement ceux où ils sont membres ou créateurs)
        const groups = await prisma.group.findMany({
            where: isAdmin ? {} : {
                OR: [
                    { createdBy: userId },
                    { members: { some: { userId } } }
                ]
            },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
                members: { select: { userId: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Enrichir avec l'info des membres (noms)
        const enrichedGroups = await Promise.all(
            groups.map(async (group: any) => ({
                ...group,
                createdBy: group.createdBy,
                memberDetails: await prisma.user.findMany({
                    where: { id: { in: group.members.map((m: any) => m.userId) } },
                    select: { id: true, fullName: true, email: true },
                }),
                isMember: group.members.some((m: any) => m.userId === userId),
                canManage: isAdmin || group.createdBy === userId,
            }))
        );

        return NextResponse.json(enrichedGroups);
    } catch (error) {
        console.error("❌ Erreur GET /api/groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log("📍 POST /api/groups - Incoming request");
        const requester = await authenticateRequester(req);
        if (!requester) {
            console.error("❌ Unauthorized requester");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = requester.id;
        console.log("📍 UserId from token:", userId);

        const body = await req.json();
        const { name, memberIds } = body;
        
        console.log("📍 Request body - name:", name, "memberIds:", memberIds);

        if (!name || !memberIds || memberIds.length === 0) {
            console.error("❌ Missing name or memberIds");
            return NextResponse.json(
                { error: "Name and at least one member required" },
                { status: 400 }
            );
        }

        // Vérifier que l'utilisateur n'est pas admin-only (juste une sécurité basique)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user) {
            console.error("❌ User not found:", userId);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if (user.role?.name === "STUDENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        console.log("📍 User found:", user.fullName, "Creating group...");
        
        // Créer le groupe SANS les membres d'abord
        const group = await prisma.group.create({
            data: {
                name,
                createdBy: userId,
            },
        });

        console.log("✅ Group created:", group.id, "- Adding", memberIds.length, "members...");
        
        // Ajouter les membres ensuite - avec gestion d'erreur
        try {
            // Toujours inclure le créateur du groupe
            const allMemberIds = [userId, ...memberIds];
            const uniqueMemberIds = Array.from(new Set(allMemberIds));
            
            console.log("📍 Preparing to add members:", uniqueMemberIds);
            
            // Vérifier que les utilisateurs existent
            const existingUsers = await prisma.user.findMany({
                where: { id: { in: uniqueMemberIds } },
                select: { id: true }
            });
            
            console.log("✅ Found", existingUsers.length, "existing users out of", uniqueMemberIds.length);
            
            const validMemberIds = existingUsers.map((u: any) => u.id);
            
            if (validMemberIds.length > 0) {
                // Créer les enregistrements en batch
                const memberRecords = validMemberIds.map((memberId: string) => ({
                    groupId: group.id,
                    userId: memberId,
                }));
                
                console.log("📍 Creating", memberRecords.length, "GroupMember records");
                
                const result = await prisma.groupMember.createMany({
                    data: memberRecords,
                    skipDuplicates: true,
                });
                console.log("✅ Members added:", result.count, "new records");
            } else {
                console.warn("⚠️  No valid members to add");
            }
        } catch (memberError) {
            console.error("❌ Error adding members:", memberError);
            throw memberError; // Re-throw pour voir l'erreur complète
        }

        // Récupérer le groupe avec les membres mis à jour
        const updatedGroup = await prisma.group.findUnique({
            where: { id: group.id },
            include: {
                creator: { select: { id: true, fullName: true } },
                members: { select: { userId: true } },
            },
        });

        console.log("✅ Group fully created:", updatedGroup?.id, "with", updatedGroup?.members.length, "members");
        return NextResponse.json(updatedGroup, { status: 201 });
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const errorCode = error?.code || 'UNKNOWN';
        const errorMeta = error?.meta ? JSON.stringify(error.meta) : 'no meta';
        
        console.error("❌ Error POST /api/groups");
        console.error("   Code:", errorCode);
        console.error("   Message:", errorMessage);
        console.error("   Meta:", errorMeta);
        console.error("   Raw error:", error);
        
        return NextResponse.json({ 
            error: "Internal server error", 
            message: errorMessage,
            code: errorCode,
            meta: error?.meta,
            details: process.env.NODE_ENV === 'development' ? { message: errorMessage, code: errorCode } : undefined
        }, { status: 500 });
    }
}

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
            groups.map(async (group: any) => {
                const memberDetails = await prisma.user.findMany({
                    where: { id: { in: group.members.map((m: any) => m.userId) } },
                    select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
                });
                const mentor = memberDetails.find((m: any) => m.role?.name === "STUDENT_MENTOR");
                return {
                    ...group,
                    createdBy: group.createdBy,
                    memberDetails,
                    mentorName: mentor?.fullName || null,
                    isMember: group.members.some((m: any) => m.userId === userId),
                    canManage: isAdmin || group.createdBy === userId,
                };
            })
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

        if (requester.isMentor && !requester.universityId) {
            return NextResponse.json(
                { error: "Student Mentor sans université affectée." },
                { status: 400 }
            );
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
            
            // Vérifier que les utilisateurs existent et appliquer le scope mentor
            const existingUsers = await prisma.user.findMany({
                where: { id: { in: uniqueMemberIds } },
                select: { id: true, role: { select: { name: true } } }
            });
            
            console.log("✅ Found", existingUsers.length, "existing users out of", uniqueMemberIds.length);
            
            let validMemberIds = existingUsers.map((u: any) => u.id);

            if (requester.isMentor) {
                const universityByUser = await getUniversityIdsForUsers(uniqueMemberIds);
                validMemberIds = existingUsers
                    .filter((u: any) => ["STUDENT", "STUDENT_MENTOR"].includes(u.role.name))
                    .map((u: any) => u.id)
                    .filter((id: string) => universityByUser.get(id) === requester.universityId);

                if (validMemberIds.length !== uniqueMemberIds.length) {
                    return NextResponse.json(
                        { error: "Tous les membres doivent être dans la même université que le mentor." },
                        { status: 403 }
                    );
                }
            }
            
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

        const enrichedGroup = updatedGroup
          ? {
              ...updatedGroup,
              memberDetails: await prisma.user.findMany({
                where: { id: { in: updatedGroup.members.map((m: any) => m.userId) } },
                select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
              }),
              mentorName: (await prisma.user.findFirst({
                where: { id: { in: updatedGroup.members.map((m: any) => m.userId) }, role: { name: "STUDENT_MENTOR" } },
                select: { fullName: true },
              }))?.fullName || null,
              canManage: requester.isAdmin || updatedGroup.createdBy === userId,
            }
          : null;

        console.log("✅ Group fully created:", updatedGroup?.id, "with", updatedGroup?.members.length, "members");
        return NextResponse.json(enrichedGroup, { status: 201 });
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

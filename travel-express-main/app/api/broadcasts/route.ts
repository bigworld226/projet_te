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

        // Récupérer les diffusions de gestion:
        // - admins: toutes
        // - non-admins: uniquement celles qu'ils ont créées
        const broadcasts = await prisma.broadcast.findMany({
            where: isAdmin ? {} : { createdBy: userId },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
                recipients: { select: { userId: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Enrichir. Seuls admin/créateur peuvent voir la liste et le nombre des destinataires.
        const enrichedBroadcasts = await Promise.all(
            broadcasts.map(async (bc: any) => {
                const canManage = isAdmin || bc.createdBy === userId;
                const isRecipient = bc.recipients.some((r: any) => r.userId === userId);
                const recipientDetails = canManage
                    ? await prisma.user.findMany({
                        where: { id: { in: bc.recipients.map((r: any) => r.userId) } },
                        select: { id: true, fullName: true, email: true },
                    })
                    : [];

                return {
                    ...bc,
                    createdBy: bc.createdBy,
                    // Ne jamais exposer la liste brute des destinataires aux non-gestionnaires
                    recipients: canManage ? bc.recipients : [],
                    recipientDetails,
                    isRecipient,
                    canManage,
                };
            })
        );

        return NextResponse.json(enrichedBroadcasts);
    } catch (error) {
        console.error("❌ Erreur GET /api/broadcasts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log("📍 POST /api/broadcasts - Incoming request");
        const requester = await authenticateRequester(req);
        if (!requester) {
            console.error("❌ Unauthorized requester");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = requester.id;
        const body = await req.json();
        const { name, recipientIds } = body;
        
        console.log("📍 Request body - name:", name, "recipientIds:", recipientIds);

        if (!name || !recipientIds || recipientIds.length === 0) {
            console.error("❌ Missing name or recipientIds");
            return NextResponse.json(
                { error: "Name and at least one recipient required" },
                { status: 400 }
            );
        }

        // Vérifier que l'utilisateur existe
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

        console.log("📍 User found:", user.fullName, "Creating broadcast...");

        // Créer la diffusion SANS les recipients d'abord
        const broadcast = await prisma.broadcast.create({
            data: {
                name,
                createdBy: userId,
            },
            include: {
                creator: { select: { id: true, fullName: true } },
                recipients: { select: { userId: true } },
            },
        });

        console.log("✅ Broadcast created:", broadcast.id, "- Adding recipients...");
        
        // Ajouter les recipients ensuite
        if (recipientIds && recipientIds.length > 0) {
            await prisma.broadcastRecipient.createMany({
                data: recipientIds.map((recipientId: string) => ({
                    broadcastId: broadcast.id,
                    userId: recipientId,
                })),
            });
            console.log("✅ Recipients added:", recipientIds.length);
        }

        // Récupérer la diffusion avec les recipients mis à jour
        const updatedBroadcast = await prisma.broadcast.findUnique({
            where: { id: broadcast.id },
            include: {
                creator: { select: { id: true, fullName: true } },
                recipients: { select: { userId: true } },
            },
        });

        console.log("✅ Broadcast fully created:", updatedBroadcast?.id);
        return NextResponse.json(updatedBroadcast, { status: 201 });
    } catch (error) {
        console.error("❌ Erreur POST /api/broadcasts:", error);
        return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
    }
}

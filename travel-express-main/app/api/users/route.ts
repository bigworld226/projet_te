import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hasPermission } from "@/lib/jwt";
import { corsHeaders } from "@/lib/cors";
import { getPrimaryUniversityIdForUser, getUniversityIdsForUsers } from "@/lib/university-scope";

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

// GET: Lister les utilisateurs
export async function GET(req: NextRequest) {
    try {
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

        // Les admins voient tous les utilisateurs
        // Gérer les deux formats: role comme string ou comme objet avec .name
        const roleName = typeof tokenPayload.role === 'string' 
            ? tokenPayload.role 
            : (tokenPayload.role as any)?.name;
        
        const isAdmin = ["SUPERADMIN", "QUALITY_OFFICER", "SECRETARY", "STUDENT_MANAGER", "FINANCE_MANAGER"].includes(roleName);
        const isMentor = roleName === "STUDENT_MENTOR";

        if (!isAdmin && !isMentor) {
            return NextResponse.json(
                { message: "Accès refusé - Seuls les admins peuvent lister les utilisateurs" },
                { status: 403, headers: corsHeaders }
            );
        }

        console.log(`✅ Accès /api/users autorisé pour ${tokenPayload.email}`);

        // Récupérer les utilisateurs
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                profileImage: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!isMentor) {
            return NextResponse.json(users, { headers: corsHeaders });
        }

        const requesterUniversityId = await getPrimaryUniversityIdForUser(tokenPayload.id);
        if (!requesterUniversityId) {
            return NextResponse.json([], { headers: corsHeaders });
        }

        const universityByUser = await getUniversityIdsForUsers(users.map((u) => u.id));
        const visible = users.filter((u) => {
            if (u.id === tokenPayload.id) return false;
            if (!["STUDENT", "STUDENT_MENTOR"].includes(u.role.name)) return false;
            return universityByUser.get(u.id) === requesterUniversityId;
        });

        return NextResponse.json(visible, { headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur GET /api/users:", err);
        return NextResponse.json(
            { message: "Erreur serveur", error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500, headers: corsHeaders }
        );
    }
}

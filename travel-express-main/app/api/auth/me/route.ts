import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Set-Cookie",
    "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

/**
 * GET: Retourner les infos de l'utilisateur actuel basées sur le JWT token
 */
export async function GET(req: NextRequest) {
    try {
        console.log("📖 GET /api/auth/me");
        
        // Récupérer le token du header Authorization
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.log("❌ Pas d'Authorization header");
            return NextResponse.json(
                { error: "Missing Authorization header" },
                { status: 401, headers: corsHeaders }
            );
        }

        // Vérifier et décoder le token
        const payload = verifyToken(authHeader);
        if (!payload) {
            console.log("❌ Token invalide ou expiré");
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401, headers: corsHeaders }
            );
        }

        console.log("✅ Utilisateur trouvé:", payload.email);

        // Retourner les données de l'utilisateur depuis le token
        return NextResponse.json({
            id: payload.id,
            email: payload.email,
            fullName: payload.fullName,
            profileImage: payload.profileImage,
            role: payload.role,
            permissions: payload.permissions
        }, { headers: corsHeaders });

    } catch (err) {
        console.error("❌ Erreur GET /api/auth/me:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: corsHeaders }
        );
    }
}

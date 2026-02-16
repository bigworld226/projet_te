import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/token
 * Retourne le token depuis le cookie HttpOnly pour le stocker en localStorage
 */
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');
        
        if (!sessionCookie?.value) {
            return NextResponse.json(
                { error: "No session token found" },
                { status: 401 }
            );
        }

        console.log("✅ Token extrait du cookie pour localStorage");
        
        return NextResponse.json(
            { token: sessionCookie.value },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Erreur récupération token:", error);
        return NextResponse.json(
            { error: "Failed to get token" },
            { status: 500 }
        );
    }
}

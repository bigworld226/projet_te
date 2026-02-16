import { NextRequest, NextResponse } from "next/server";
import { setTempUser, getTempUser } from "@/lib/tmp-user-store";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Set-Cookie",
    "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // ✅ Accepter le user directement OU dans body.user
        let user = body.user || body;
        console.log("📝 POST /api/auth/temp-user - User:", user.email || "UNKNOWN");
        
        // 🔐 IMPORTANT: Enrichir le user avec les rôle à jour depuis la BD
        if (user.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: { 
                    id: true,
                    email: true,
                    fullName: true,
                    profileImage: true,
                    role: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            if (dbUser) {
                user = {
                    id: dbUser.id,
                    email: dbUser.email,
                    fullName: dbUser.fullName,
                    profileImage: dbUser.profileImage,
                    role: {
                        id: dbUser.role.id,
                        name: dbUser.role.name
                    }
                };
                console.log("✅ User enrichi depuis BD - Rôle:", dbUser.role.name);
            }
        }
        
        setTempUser(user);
        
        return Response.json({ success: true }, { headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur POST temp-user:", err);
        return Response.json({ error: "Failed to save user" }, { status: 400, headers: corsHeaders });
    }
}

export async function GET() {
    try {
        const user = getTempUser();
        if (!user) {
            console.log("❌ GET /api/auth/temp-user - Pas d'user");
            return Response.json({ user: null }, { headers: corsHeaders });
        }
        
        console.log("✅ GET /api/auth/temp-user - User:", user.email);
        return Response.json({ user }, { headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur GET temp-user:", err);
        return Response.json({ error: "Server error" }, { status: 500, headers: corsHeaders });
    }
}

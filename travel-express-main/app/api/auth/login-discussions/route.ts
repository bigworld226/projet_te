import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";
import { getTempUser, clearTempUser } from "@/lib/tmp-user-store";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

/**
 * GET: Générer un JWT token pour Travel Express Discussions
 * Récupère le user stocké temporairement et génère un JWT
 */
export async function GET(req: NextRequest) {
    try {
        console.log("📖 GET /api/auth/login-discussions");
        
        let user = getTempUser();
        if (!user) {
            console.log("❌ Pas de user temporaire trouvé");
            return Response.json({ error: "No user session" }, { status: 401, headers: corsHeaders });
        }

        console.log("📦 User trouvé dans tmp-user-store:", user.email);
        console.log("   Champs disponibles:", Object.keys(user));

        // 🔐 IMPORTANT: TOUJOURS enrichir/vérifier le rôle depuis la BD (même si user a un ID)
        // Cela garantit que le rôle est à jour au moment du login
        if (user.email) {
            console.log("🔍 Enrichissement du user depuis la BD...");
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
                        name: dbUser.role.name
                    }
                };
                console.log("✅ User enrichi depuis BD - Rôle:", dbUser.role.name);
            } else {
                console.warn("⚠️  User pas trouvé dans BD");
                // Utiliser l'user tel quel même s'il manque des champs
            }
        }

        clearTempUser(); // Nettoyer après récupération

        // Générer le JWT token
        if (!user) {
            return Response.json({ error: "User data not found" }, { status: 401, headers: corsHeaders });
        }
        
        const token = signToken(user);
        console.log("✅ JWT token généré pour:", user.email, "| Rôle final:", user.role?.name);

        return Response.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                profileImage: user.profileImage || null,
                role: user.role
            }
        }, { headers: corsHeaders });
    } catch (err) {
        console.error("❌ Erreur GET login-discussions:", err);
        return Response.json({ error: "Failed to generate token" }, { status: 500, headers: corsHeaders });
    }
}

import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/current
 * Retourne les données de l'utilisateur actuellement connecté
 */
export async function GET() {
  try {
    const session = await authService.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profileImage: true,
        role: {
          select: { name: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

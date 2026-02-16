import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * GET /api/student/groups
 * Récupère tous les groupes auxquels l'étudiant appartient
 */
export async function GET(request: Request) {
  try {
    const session = await authService.getSession(request);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers: corsHeaders });
    }

    // Récupérer les groupes de l'utilisateur
    const groups = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            creator: {
              select: { id: true, fullName: true, profileImage: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, fullName: true, profileImage: true }
                }
              }
            }
          }
        }
      }
    });

    const formattedGroups = groups.map((gm: any) => ({
      id: gm.group.id,
      name: gm.group.name,
      creator: gm.group.creator,
      memberCount: gm.group.members.length,
      // ❌ Ne pas envoyer les noms des autres membres aux étudiants pour des raisons de privacy
      createdAt: gm.group.createdAt
    }));

    return NextResponse.json({ groups: formattedGroups }, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Error fetching student groups:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: corsHeaders });
  }
}

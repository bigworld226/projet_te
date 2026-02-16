import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET() {
  // Tous les admins peuvent voir le dashboard
  const admin = await requireAdminWithPermission(["ALL_ACCESS", "MANAGE_STUDENTS", "VIEW_STUDENTS", "MANAGE_DOCUMENTS", "VIEW_FINANCES", "MANAGE_FINANCES", "MANAGE_UNIVERSITIES", "MANAGE_DISCUSSIONS"]);
  if (!admin) {
    return NextResponse.json({ 
      error: "Accès refusé",
      message: "Vous n'avez pas les droits nécessaires pour accéder au tableau de bord administratif."
    }, { status: 403 });
  }

  try {
    // 1. Agrégation des statistiques clés
    const [universityCount, studentCount, applicationCount, documentCount] = await Promise.all([
      prisma.university.count(),
      prisma.user.count({ where: { role: { name: 'STUDENT' } } }),
      prisma.application.count(),
      prisma.document.count(),
    ]);

    // 2. Récupération des candidatures avec les champs pour le filtrage admin
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        userId: true,
        universityId: true,
        status: true,
        updatedAt: true,
        country: true,
        // On inclut aussi le nom de l'étudiant pour l'affichage dans le tableau
        user: {
          select: {
            fullName: true,
          }
        },
        // Et le nom de l'université si elle est déjà assignée
        university: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      universityCount,
      studentCount,
      applicationCount,
      documentCount,
      applications,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET() {
  const admin = await requireAdminWithPermission(["MANAGE_STUDENTS", "VIEW_STUDENTS"]);
  if (!admin) {
    return NextResponse.json({ 
      error: "Accès refusé",
      message: "Vous n'avez pas les permissions nécessaires pour voir la liste des étudiants. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."
    }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { name: 'STUDENT' },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        passportNumber: true,    // Inclus pour l'admin
        specificDiseases: true,  // Inclus pour l'admin
        createdAt: true,
        // On inclut les applications pour que l'admin puisse 
        // voir les dossiers créés par cet étudiant
        applications: {
          select: {
            id: true,
            country: true,
            status: true,
            applicationFee: true, // Pour voir combien il doit payer
          }
        },
        // Optionnel : on peut aussi compter les paiements
        _count: {
          select: {
            payments: true,
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET_STUDENTS_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des étudiants" }, 
      { status: 500 }
    );
  }
}
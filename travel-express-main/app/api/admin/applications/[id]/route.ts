import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Type sécurisé pour Next.js 15
) {
  const { id } = await params;

  const admin = await requireAdminWithPermission(["MANAGE_STUDENTS", "VIEW_STUDENTS", "MANAGE_DOCUMENTS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        // 1. Infos complètes sur l'étudiant (pour l'admin)
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            specificDiseases: true, // Antécédents si stockés sur le profil User
          }
        },
        // 2. L'université (peut être null au début)
        university: true,
        // 3. Tous les documents envoyés
        documents: {
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application non trouvée" }, 
        { status: 404 }
      );
    }

    /* Note technique : 
      Les champs 'passportNumber' et 'medicalHistory' sont sur le modèle User (pas Application).
      Ils sont accessibles via application.user.passportNumber etc.
    */

    return NextResponse.json({ application });
  } catch (error) {
    console.error("[ADMIN_APP_DETAIL_GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'application" }, 
      { status: 500 }
    );
  }
}
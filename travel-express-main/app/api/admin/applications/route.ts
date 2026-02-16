import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET(req: Request) {
  const admin = await requireAdminWithPermission(["MANAGE_STUDENTS", "VIEW_STUDENTS", "MANAGE_DOCUMENTS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const where = userId ? { userId } : {};

    const applications = await prisma.application.findMany({
      where,
      include: {
        // 1. On inclut l'étudiant pour avoir ses infos de contact
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            specificDiseases: true, // Antécédents médicaux (si stockés sur le User)
          }
        },
        // 2. L'université (sera null si pas encore assignée)
        university: true,
        // 3. Les documents justificatifs
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Note : 'passportNumber' et 'medicalHistory' sont sur le modèle User, pas Application.
    // Ils sont accessibles via application.user.passportNumber etc.
    
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[API_APPLICATIONS_GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des candidatures" }, 
      { status: 500 }
    );
  }
}
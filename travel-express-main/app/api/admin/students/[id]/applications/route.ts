import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminWithPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminWithPermission(["MANAGE_STUDENTS", "VIEW_STUDENTS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    // 1. IL FAUT ATTENDRE LES PARAMS ICI
    const resolvedParams = await params; 
    const studentId = resolvedParams.id;

    if (!studentId) {
      return new NextResponse("ID Étudiant manquant", { status: 400 });
    }

    // 2. Requête filtrée avec le bon ID
    const applications = await prisma.application.findMany({
      where: {
        userId: studentId, 
      },
      include: {
        university: true, 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[SUCCESS] ${applications.length} dossiers trouvés pour ${studentId}`);

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("ERREUR_RECUP_DOSSIERS:", error);
    return new NextResponse("Erreur Interne", { status: 500 });
  }
}
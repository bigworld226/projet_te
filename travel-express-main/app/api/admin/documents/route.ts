import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET() {
  const admin = await requireAdminWithPermission(["MANAGE_DOCUMENTS", "VALIDATE_DOCUMENTS"]);
  if (!admin) {
    return NextResponse.json({ 
      error: "Accès refusé",
      message: "Vous n'avez pas les permissions pour consulter les documents des étudiants."
    }, { status: 403 });
  }

  try {
    const documents = await prisma.document.findMany({
      include: {
        application: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            university: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des documents" }, { status: 500 });
  }
}

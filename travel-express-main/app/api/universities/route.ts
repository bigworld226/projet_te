import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET() {
  const admin = await requireAdminWithPermission(["MANAGE_UNIVERSITIES"]);
  if (!admin) {
    return NextResponse.json({
      error: "Accès refusé",
      message: "Vous n'avez pas la permission de consulter le catalogue des universités."
    }, { status: 403 });
  }

  let universities;
  try {
    universities = await prisma.university.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
  return NextResponse.json(universities);
}

import { NextResponse } from "next/server";
import { requireAdminWithPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminWithPermission(["ALL_ACCESS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Charger les vrais admins depuis la DB
  const admins = await prisma.user.findMany({
    where: { role: { name: { not: 'STUDENT' } } },
    select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
  });

  const settings = {
    name: "Agence Université",
    email: "admin@agence.com",
    notifications: true,
    admins,
  };

  return NextResponse.json({ settings });
}

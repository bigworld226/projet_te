import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

export async function GET() {
  const session = await authService.getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: { select: { name: true } } },
  });

  if (!currentUser || currentUser.role.name === "STUDENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Seul le super admin reçoit la liste de nomination.
  const admins =
    currentUser.role.name === "SUPERADMIN"
      ? await prisma.user.findMany({
          where: { role: { name: { not: "STUDENT" } } },
          select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
        })
      : [];

  const settings = {
    name: "Agence Université",
    email: "admin@agence.com",
    notifications: true,
    admins,
    roleName: currentUser.role.name,
  };

  return NextResponse.json({ settings });
}

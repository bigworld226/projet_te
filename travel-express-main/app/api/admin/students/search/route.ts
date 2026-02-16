import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminWithPermission } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const admin = await requireAdminWithPermission(["MANAGE_STUDENTS", "VIEW_STUDENTS"]);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] });
    }

    // Utilisation de findMany avec contains pour la recherche textuelle
    const students = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        // On s'assure de ne pas retourner les admins dans la recherche client
        role: { name: "STUDENT" }, 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      take: 5,
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("SEARCH_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
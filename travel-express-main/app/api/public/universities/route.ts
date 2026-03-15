import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const universities = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(universities);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


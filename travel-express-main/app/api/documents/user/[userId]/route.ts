import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const applications = await prisma.application.findMany({
            where: { userId: params.userId },
            include: { documents: true }
        });

        const allDocs = applications.flatMap(app => app.documents);

        return NextResponse.json(allDocs);
    } catch (err) {
        return NextResponse.json({ message: "Erreur chargement" }, { status: 500 });
    }
}
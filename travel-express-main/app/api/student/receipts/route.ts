import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { parseReceiptDetails } from "@/lib/receipts";

export async function GET() {
  try {
    const session = await authService.getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const where = {
      action: "RECEIPT_GENERATED",
      targetType: "RECEIPT",
      ...(user.role.name === "STUDENT" ? { targetId: user.id } : {}),
    };

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { admin: { select: { fullName: true, email: true } } },
    });

    const receipts = logs.map((log) => {
      const details = parseReceiptDetails(log.details);
      return {
        id: log.id,
        createdAt: log.createdAt,
        receiptNumber: details?.receiptNumber ?? null,
        receiptType: details?.receiptType ?? "Reçu",
        templateName: details?.templateName ?? "Modèle standard",
        recipientName: details?.recipientName ?? "",
        amount: details?.amount ?? null,
        note: details?.note ?? "",
        downloadUrl: `/api/student/receipts/${log.id}/download`,
        issuedBy: details?.issuedBy ?? log.admin?.fullName ?? log.admin?.email ?? "Administration",
      };
    });

    return NextResponse.json({ receipts });
  } catch (error) {
    console.error("GET /api/student/receipts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

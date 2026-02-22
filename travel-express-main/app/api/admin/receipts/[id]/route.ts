import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { parseReceiptDetails } from "@/lib/receipts";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } },
    });

    if (!admin || admin.role.name !== "SUPERADMIN") {
      return NextResponse.json({ error: "Suppression réservée au SuperAdmin" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.activityLog.findFirst({
      where: { id, targetType: "RECEIPT", action: "RECEIPT_GENERATED" },
      select: { id: true, details: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 });
    }

    const details = parseReceiptDetails(existing.details);
    await prisma.activityLog.update({
      where: { id: existing.id },
      data: {
        action: "RECEIPT_DELETED",
        details: JSON.stringify({
          ...details,
          deletedAt: new Date().toISOString(),
          deletedByRole: "SUPERADMIN",
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/receipts/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

const ADMIN_ROLES = new Set([
  "SUPERADMIN",
  "QUALITY_OFFICER",
  "SECRETARY",
  "STUDENT_MANAGER",
]);

async function canManageMessage(messageId: string, req: NextRequest) {
  const session = await authService.getSession(req);
  if (!session?.userId) return { ok: false as const, status: 401 };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true },
  });

  if (!message) return { ok: false as const, status: 404 };

  const isOwner = message.senderId === session.userId;
  const isAdmin = ADMIN_ROLES.has(session.role);

  if (!isOwner && !isAdmin) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const content = String(body?.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { message: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    const access = await canManageMessage(id, req);
    if (!access.ok) {
      const message =
        access.status === 401
          ? "Non authentifié"
          : access.status === 404
          ? "Message introuvable"
          : "Accès refusé";
      return NextResponse.json({ message }, { status: access.status });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json(updatedMessage);
  } catch (err) {
    console.error("❌ Erreur PATCH /api/messages/[id]:", err);
    return NextResponse.json({ message: "Erreur modification" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await canManageMessage(id, req);

    if (!access.ok) {
      const message =
        access.status === 401
          ? "Non authentifié"
          : access.status === 404
          ? "Message introuvable"
          : "Accès refusé";
      return NextResponse.json({ message }, { status: access.status });
    }

    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur DELETE /api/messages/[id]:", err);
    return NextResponse.json({ message: "Erreur suppression" }, { status: 500 });
  }
}

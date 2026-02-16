import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

/**
 * DELETE /api/student/groups/[groupId]
 * Supprimer un groupe (admin ou créateur)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const groupId = params.groupId;

    // Vérifier le token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tokenPayload = verifyToken(authHeader);
    if (!tokenPayload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = tokenPayload.id;
    const userRole = tokenPayload.role?.name;
    const isAdmin = userRole === "SUPERADMIN" || userRole === "SECRETARY";

    // Récupérer le groupe
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, createdBy: true },
    });

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // Vérifier les permissions (créateur ou admin)
    if (group.createdBy !== userId && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Supprimer tous les messages du groupe
    await prisma.message.deleteMany({
      where: { groupId },
    });

    // Supprimer tous les participants du groupe
    await prisma.groupMember.deleteMany({
      where: { groupId },
    });

    // Supprimer le groupe
    await prisma.group.delete({
      where: { id: groupId },
    });

    console.log(`✅ Groupe ${groupId} supprimé par ${tokenPayload.email}`);

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("❌ Erreur DELETE /api/student/groups/[groupId]:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

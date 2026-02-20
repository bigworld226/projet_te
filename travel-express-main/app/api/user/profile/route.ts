import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const userId = decoded.id;
        const { fullName, email, phone, password, newPassword } = await req.json();

        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Si on change le mot de passe, vérifier l'ancien
        let updateData: any = {};

        if (fullName) updateData.fullName = fullName;
        if (phone) updateData.phone = phone;

        // Gérer le changement d'email
        if (email && email !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
            updateData.email = email;
        }

        // Gérer le changement de mot de passe
        if (newPassword) {
            if (!password) {
                return NextResponse.json(
                    { error: "Current password required to change password" },
                    { status: 400 }
                );
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedNewPassword;
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                roleId: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("❌ Erreur PATCH /api/user/profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

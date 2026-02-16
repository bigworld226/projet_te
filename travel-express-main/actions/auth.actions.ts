'use server';

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Déconnexion utilisateur (Server Action)
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('user_id');
    cookieStore.delete('session');
    return { success: true };
  } catch (error: any) {
    console.error('[logoutAction] Error:', error);
    return { success: false, error: error?.message || 'Erreur lors de la déconnexion.' };
  }
}
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { requireAdminAction } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Inscription d'un nouvel étudiant
 */
export async function registerAction(prevState: any, formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;

  if (!email || !password || !fullName) {
    return { error: "Veuillez remplir tous les champs obligatoires." };
  }

  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caractères." };
  }

  try {
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return { error: "Cet email est déjà utilisé." };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userService.createStudent({
      email,
      password: hashedPassword,
      fullName,
      phone,
    });

    // Créer session avec le nom du rôle et sessionVersion
    await authService.createSession(newUser.id, newUser.role.name, 1);

    redirect('/student');
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Register Error:", error);
    return { error: "Impossible de créer le compte. Réessayez." };
  }
}

/**
 * Liste tous les admins (non-étudiants)
 */
export async function getAdminsAction() {
  await requireAdminAction(["ALL_ACCESS"]);

  const admins = await prisma.user.findMany({
    where: {
      role: { name: { not: "STUDENT" } },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return admins.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    role: a.role.name,
  }));
}

/**
 * Liste tous les utilisateurs (pour le picker de promotion)
 */
export async function getAllUsersAction() {
  await requireAdminAction(["ALL_ACCESS"]);

  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Met à jour le rôle d'un utilisateur (promotion/destitution)
 * Seul le SUPERADMIN peut le faire.
 */
export async function updateUserRoleAction(userId: string, roleName: string) {
  try {
    console.log("[updateUserRoleAction] Called for userId:", userId, "roleName:", roleName);
    await requireAdminAction(["ALL_ACCESS"]);

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.error("[updateUserRoleAction] Rôle introuvable:", roleName);
      return { success: false, error: "Rôle introuvable." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { 
        roleId: role.id,
        sessionVersion: { increment: 1 }, // Invalide la session actuelle
      },
    });
    console.log("[updateUserRoleAction] User updated:", updated);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[updateUserRoleAction] Error:", error);
    // Retourne l'erreur détaillée côté front si possible
    return { success: false, error: error?.message || "Impossible de modifier le rôle." };
  }
}

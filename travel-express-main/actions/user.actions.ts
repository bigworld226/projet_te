'use server';

import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Récupère l'utilisateur courant avec son rôle
 */
export async function getCurrentUserAction() {
  const userId = await authService.requireUser();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      passportNumber: true,
      specificDiseases: true,
      medicalHistory: true,
      role: { select: { name: true, permissions: true } },
      createdAt: true,
    },
  });

  return user;
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateProfileAction(formData: FormData) {
  const userId = await authService.requireUser();

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { fullName, email, phone },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/student/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, error: "Impossible de mettre à jour le profil" };
  }
}

/**
 * Changer le mot de passe
 */
export async function updatePasswordAction(formData: FormData) {
  const userId = await authService.requireUser();

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Tous les champs sont requis." };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "Le nouveau mot de passe doit faire au moins 6 caractères." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Les mots de passe ne correspondent pas." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    // Vérifier l'ancien mot de passe
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Mot de passe actuel incorrect." };
    }

    // Hasher et sauvegarder le nouveau
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Update Password Error:", error);
    return { success: false, error: "Impossible de changer le mot de passe." };
  }
}

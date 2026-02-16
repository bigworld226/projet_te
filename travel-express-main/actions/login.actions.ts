'use server';

import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  try {
    // 1. Chercher utilisateur (inclut le rôle via userService)
    const user = await userService.findByEmail(email);
    if (!user) {
      return { error: "Identifiants invalides" };
    }

    // 2. Vérifier le mot de passe avec bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { error: "Identifiants invalides" };
    }

    // 3. Récupérer le sessionVersion pour la session
    const { prisma } = await import('@/lib/prisma');
    const userWithVersion = await prisma.user.findUnique({
      where: { id: user.id },
      select: { sessionVersion: true },
    });

    // 4. Créer session avec le nom du rôle IAM et sessionVersion
    await authService.createSession(user.id, user.role.name, userWithVersion?.sessionVersion);

    // 5. Redirection selon le rôle
    if (user.role.name === 'STUDENT') {
      redirect('/student/dashboard');
    } else {
      redirect('/admin/dashboard');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Login Error:", error);
    return { error: "Une erreur est survenue" };
  }
}

import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { Permission } from "@prisma/client";
import { redirect } from "next/navigation";

const MESSAGING_ALLOWED_ROLES = new Set(["SUPERADMIN", "STUDENT_MANAGER"]);
const DOCUMENT_FALLBACK_ROLES = new Set(["SECRETARY", "QUALITY_OFFICER"]);

function canUseMessagingRole(roleName: string) {
  return MESSAGING_ALLOWED_ROLES.has(roleName);
}

function hasDocumentFallbackByRole(roleName: string, requiredPermissions: Permission[]) {
  if (!DOCUMENT_FALLBACK_ROLES.has(roleName)) return false;
  return requiredPermissions.some(
    (permission) => permission === "MANAGE_DOCUMENTS" || permission === "VALIDATE_DOCUMENTS"
  );
}

/**
 * Récupère l'utilisateur admin courant avec son rôle et permissions.
 * Redirige vers /student/ si c'est un étudiant.
 * Redirige vers /login si non authentifié.
 */
export async function getAdminUser() {
  const userId = await authService.requireUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: {
        select: {
          name: true,
          permissions: true,
        },
      },
    },
  });

  if (!user || user.role.name === "STUDENT") {
    redirect("/student/");
  }

  return user;
}

/**
 * Vérifie qu'un utilisateur a au moins UNE des permissions requises.
 * Le SUPERADMIN (ALL_ACCESS) passe toujours.
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes("ALL_ACCESS")) return true;
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/**
 * Récupère l'admin courant ET vérifie les permissions.
 * Retourne l'user si OK, sinon retourne null (pour les API routes).
 */
export async function requireAdminWithPermission(
  requiredPermissions: Permission[]
): Promise<{
  id: string;
  email: string;
  fullName: string | null;
  role: { name: string; permissions: Permission[] };
} | null> {
  try {
    const userId = await authService.getUserId();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user || user.role.name === "STUDENT") return null;
    if (
      !hasPermission(user.role.permissions, requiredPermissions) &&
      !hasDocumentFallbackByRole(user.role.name, requiredPermissions)
    ) {
      return null;
    }
    if (
      requiredPermissions.includes("MANAGE_DISCUSSIONS") &&
      !canUseMessagingRole(user.role.name)
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Pour les Server Actions : récupère l'admin et vérifie les permissions.
 * Redirige si non autorisé.
 */
export async function requireAdminAction(requiredPermissions: Permission[]) {
  const userId = await authService.requireUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: {
        select: {
          name: true,
          permissions: true,
        },
      },
    },
  });

  if (!user || user.role.name === "STUDENT") {
    redirect("/student/");
  }

  if (
    !hasPermission(user.role.permissions, requiredPermissions) &&
    !hasDocumentFallbackByRole(user.role.name, requiredPermissions)
  ) {
    throw new Error("Permissions insuffisantes");
  }
  if (
    requiredPermissions.includes("MANAGE_DISCUSSIONS") &&
    !canUseMessagingRole(user.role.name)
  ) {
    throw new Error("Accès messagerie refusé pour ce rôle");
  }

  return user;
}

/**
 * Mapping des menus sidebar vers les permissions requises.
 * null = accessible à tout admin (non-étudiant).
 */
export const SIDEBAR_PERMISSIONS: Record<string, Permission[] | null> = {
  "/admin/dashboard": ["ALL_ACCESS", "MANAGE_STUDENTS", "VIEW_STUDENTS", "MANAGE_DOCUMENTS", "VALIDATE_DOCUMENTS", "VIEW_FINANCES", "MANAGE_FINANCES", "MANAGE_UNIVERSITIES"],
  "/admin/students": ["MANAGE_STUDENTS", "VIEW_STUDENTS"],
  "/admin/documents": ["MANAGE_DOCUMENTS", "VALIDATE_DOCUMENTS"],
  "/admin/universities": ["MANAGE_UNIVERSITIES"],
  "/admin/finances": ["VIEW_FINANCES", "MANAGE_FINANCES"],
  "/admin/activity": ["ALL_ACCESS", "MANAGE_DOCUMENTS", "VALIDATE_DOCUMENTS"],
  "/admin/archive": ["ALL_ACCESS"],
  "/admin/messaging": ["MANAGE_DISCUSSIONS"],
  "/admin/settings": ["ALL_ACCESS"],
};

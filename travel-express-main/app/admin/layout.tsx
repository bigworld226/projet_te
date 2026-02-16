import AdminSidebar from "@/components/admin/AdminSidebar";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Protection : On récupère l'ID via le service d'auth
  const userId = await authService.requireUser();

  // 2. On récupère les infos nécessaires avec les permissions
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { 
      role: { select: { name: true, permissions: true } }, 
      fullName: true, 
      email: true 
    } 
  });

  // 3. Sécurité : Seuls les étudiants sont exclus
  if (!user || user.role.name === 'STUDENT') {
    redirect('/student');
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      {/* Sidebar Admin : filtrée par permissions */}
      <AdminSidebar user={user} />
      
      {/* Zone de contenu principale */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
'use server'

import { authService } from "@/services/auth.service"

import { prisma } from "@/lib/prisma"
import { ApplicationStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Vérifier que l'user est bien admin
async function requireAdmin() {
  const userId = await authService.requireUser();
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { role: true } // Include the 'role' field
  });
  
  if (user?.role?.name !== 'ADMIN') {
    redirect('/student/');
  }
  return user;
}

// Action pour changer le statut d'un dossier
export async function updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus) {
  await requireAdmin();
  
  // Logique métier : mettre à jour la progression en % selon le statut
  let progress = 0;
  switch (newStatus) {
    case 'DRAFT': progress = 10; break;
    case 'SUBMITTED': progress = 20; break;
    case 'UNDER_REVIEW': progress = 40; break;
    case 'ACCEPTED': progress = 60; break;
    case 'JW202_RECEIVED': progress = 70; break;
    case 'VISA_GRANTED': progress = 90; break;
    case 'FLIGHT_BOOKED': progress = 95; break;
    case 'COMPLETED': progress = 100; break;
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { 
      status: newStatus,
      progress: progress 
    }
  });

  revalidatePath('/admin/dashboard');
}

// Action pour supprimer un dossier (au cas où)
export async function deleteApplication(applicationId: string) {
  await requireAdmin();
  await prisma.application.delete({ where: { id: applicationId } });
  revalidatePath('/admin/dashboard');
}
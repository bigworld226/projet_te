'use server';

import { prisma } from "@/lib/prisma";
import { applicationService } from "@/services/application.service";
import { authService } from "@/services/auth.service";
import { requireAdminAction } from "@/lib/permissions";
import { ApplicationStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Créer un dossier de candidature (côté étudiant)
 * Accepte un FormData avec au minimum : country
 * Optionnellement : fullName, passportNumber, diseases[]
 */
export async function createApplicationAction(formData: FormData) {
  try {
    const userId = await authService.requireUser();
    const country = formData.get('country') as string;

    if (!country) {
      return { error: "Le pays de destination est requis." };
    }

    // Mise à jour optionnelle du profil étudiant
    const fullName = formData.get('fullName') as string | null;
    const passportNumber = formData.get('passportNumber') as string | null;
    const diseases = formData.getAll('diseases') as string[];

    const profileUpdate: Record<string, any> = {};
    if (fullName) profileUpdate.fullName = fullName;
    if (passportNumber) profileUpdate.passportNumber = passportNumber;
    if (diseases.length > 0) {
      const cleanDiseases = diseases.filter(d => d.trim() !== '');
      if (cleanDiseases.length > 0) {
        profileUpdate.specificDiseases = cleanDiseases.join(', ');
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: profileUpdate,
      });
    }

    await applicationService.createApplication(userId, country);
    revalidatePath('/student/dashboard');
    redirect('/student/dashboard');
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Application Error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors de la création du dossier.";
    return { error: msg };
  }
}

/**
 * Assigner une université à un dossier (côté admin)
 */
export async function assignUniversityAction(applicationId: string, universityId: string) {
  try {
    await requireAdminAction(["MANAGE_STUDENTS"]);

    await prisma.application.update({
      where: { id: applicationId },
      data: { universityId },
    });

    revalidatePath(`/admin/students`);
    revalidatePath(`/admin/applications/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error("assignUniversityAction error:", error);
    return { success: false, error: "Erreur lors de l'assignation." };
  }
}

/**
 * Changer le statut d'un dossier (côté admin)
 */
export async function updateApplicationStatusAction(applicationId: string, newStatus: string) {
  try {
    await requireAdminAction(["MANAGE_STUDENTS"]);

    // Logique métier : progression selon le statut
    let progress = 0;
    switch (newStatus as ApplicationStatus) {
      case 'DRAFT': progress = 10; break;
      case 'SUBMITTED': progress = 20; break;
      case 'UNDER_REVIEW': progress = 40; break;
      case 'ACCEPTED': progress = 60; break;
      case 'JW202_RECEIVED': progress = 70; break;
      case 'VISA_GRANTED': progress = 90; break;
      case 'FLIGHT_BOOKED': progress = 95; break;
      case 'COMPLETED': progress = 100; break;
      case 'REJECTED': progress = 0; break;
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus as ApplicationStatus,
        progress,
      },
    });

    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath('/admin/students');
    revalidatePath('/student/dashboard');

    return { success: true };
  } catch (error) {
    console.error("updateApplicationStatusAction error:", error);
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

/**
 * Rejeter un dossier avec un motif
 */
export async function rejectApplicationAction(applicationId: string, reason: string) {
  try {
    await requireAdminAction(["MANAGE_STUDENTS"]);

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        progress: 0,
      },
    });

    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath('/admin/students');
    revalidatePath('/student/dashboard');

    return { success: true };
  } catch (error) {
    console.error("rejectApplicationAction error:", error);
    return { success: false, error: "Erreur lors du rejet." };
  }
}

/**
 * Supprimer un dossier de candidature
 */
export async function deleteApplicationAction(applicationId: string) {
  try {
    if (!applicationId) return { success: false, error: "Application ID requis" };

    await requireAdminAction(["MANAGE_STUDENTS"]);

    // Supprimer les messages de la conversation liée
    const conversation = await prisma.conversation.findUnique({
      where: { applicationId },
    });

    if (conversation) {
      await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
      await prisma.conversationParticipant.deleteMany({ where: { conversationId: conversation.id } });
      await prisma.conversation.delete({ where: { id: conversation.id } });
    }

    // Supprimer les paiements et documents liés
    await prisma.payment.deleteMany({ where: { applicationId } });
    await prisma.document.deleteMany({ where: { applicationId } });

    await prisma.application.delete({ where: { id: applicationId } });

    revalidatePath('/admin/students');
    return { success: true };
  } catch (error) {
    console.error("deleteApplicationAction error:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

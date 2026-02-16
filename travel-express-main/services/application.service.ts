import { prisma } from "@/lib/prisma"
import { ApplicationStatus } from "@prisma/client"

/**
 *  On synchronise la progression avec le statut
 */
const getProgress = (status: ApplicationStatus): number => {
  const map: Record<ApplicationStatus, number> = {
    DRAFT: 10,
    SUBMITTED: 20,
    UNDER_REVIEW: 40,
    ACCEPTED: 60,
    JW202_RECEIVED: 70,
    VISA_GRANTED: 90,
    FLIGHT_BOOKED: 95,
    COMPLETED: 100,
    REJECTED: 0,
  };
  return map[status] ?? 0;
};

export const applicationService = {
  /**
   * Créer une candidature avec récupération automatique des frais
   */
  async createApplication(userId: string, country: string) {
    // 1. Empêcher les doublons
    const existing = await prisma.application.findFirst({
      where: { userId, country }
    });

    if (existing) {
      throw new Error(`Une candidature pour le pays "${country}" existe déjà.`);
    }

    // 2. Chercher le montant des frais configuré pour ce pays
    const feeConfig = await prisma.feesByCountry.findUnique({
      where: { country }
    });

    return prisma.application.create({
      data: {
        userId,
        country,
        status: "DRAFT",
        progress: getProgress("DRAFT"),
        applicationFee: feeConfig ? feeConfig.amount : 0, 
      }
    });
  },

  /**
   * Récupérer les dossiers d'un étudiant (Vue Dashboard Etudiant)
   */
  async getStudentApplications(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            pdfUrl: true, 
            images: true
          }
        },
        documents: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  /**
   * Récupérer un dossier complet par son ID
   */
  async getApplicationById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            passportNumber: true,
            specificDiseases:true
          }
        },
        university: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  /**
   * Dashboard Admin : Liste tous les dossiers
   */
  async getAllApplications() {
    return prisma.application.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        university: { select: { name: true } },
        _count: { select: { documents: true } } // On récupère juste le nombre de docs pour la liste
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};
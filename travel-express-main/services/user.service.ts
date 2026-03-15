import { prisma } from "@/lib/prisma"
import { StudentEnrollmentType } from "@prisma/client";

export const userService = {
  /**
   * Trouve un utilisateur par email avec normalisation
   */
  async findByEmail(email: string) {
    if (!email) return null;
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });
  },

  /**
   * Crée un étudiant avec gestion des types Prisma
   * On connecte le rôle "STUDENT" par son nom unique
   */
  async createStudent(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
    enrollmentType?: StudentEnrollmentType;
    universityId?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          password: data.password,
          fullName: data.fullName.trim(),
          phone: data.phone,
          enrollmentType: data.enrollmentType || "NEW_PROCEDURE",
          role: { connect: { name: "STUDENT" } },
        },
        include: { role: true },
      });

      if (data.enrollmentType === "ALREADY_ABROAD_WITH_AGENCY" && data.universityId) {
        const university = await tx.university.findUnique({
          where: { id: data.universityId },
          select: { country: true },
        });

        if (university) {
          await tx.application.create({
            data: {
              userId: user.id,
              universityId: data.universityId,
              country: university.country || "Chine",
              status: "ACCEPTED",
              progress: 100,
              paymentStatus: "COMPLETED",
            },
          });
        }
      }

      return user;
    });
  },
  
  /**
   * Récupère un profil complet avec une sélection précise
   * (On évite de charger le mot de passe ici par sécurité)
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: { select: { name: true } },
        createdAt: true,
        applications: {
          include: { 
            university: {
                select: {
                    id: true,
                    name: true,
                    country: true,
                    city: true
                }
            } 
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  },

  /**
   * Dashboard Admin : Liste des étudiants avec compteurs
   */
  async getAllStudents() {
    return prisma.user.findMany({
      where: { role: { name: 'STUDENT' } },
      select: {
        id: true,
        fullName: true,
        email: true,
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

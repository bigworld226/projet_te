'use server';

import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { authService } from "@/services/auth.service";
import { requireAdminAction } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload d'un document par un étudiant
 */
export async function uploadDocumentAction(formData: FormData) {
  try {
    const userId = await authService.requireUser();

    const applicationId = formData.get('applicationId') as string;
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;

    if (!applicationId || !type || !file) {
      return { error: "Champs manquants" };
    }

    // Vérification taille (5Mo max)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Fichier trop volumineux. Max 5Mo." };
    }

    // Vérification MIME
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Type de fichier non autorisé (PDF, JPG, PNG seulement)." };
    }

    // Vérifier que le dossier appartient à l'utilisateur
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!app) {
      return { error: "Non autorisé" };
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      return { error: "Extension de fichier suspecte." };
    }

    const documentId = uuidv4();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "travel_express/documents",
          resource_type: 'auto',
          public_id: documentId,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    }).catch((err) => {
      console.error("Cloudinary upload error:", err);
      return null;
    });

    if (!uploadResult) {
      return { error: "Echec de l'upload." };
    }

    const uploadedFile = uploadResult as any;
    const fileUrl = uploadedFile.secure_url;

    await prisma.document.create({
      data: {
        applicationId,
        type,
        name: file.name,
        url: fileUrl,
        status: "PENDING",
      },
    });

    revalidatePath('/student/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Upload failed", error);
    return { error: "Echec de l'upload." };
  }
}

/**
 * Vérification d'un document par un admin qualité
 */
export async function verifyDocumentAction(
  documentId: string,
  status: 'APPROVED' | 'REJECTED',
  comment?: string
) {
  try {
    const admin = await requireAdminAction(["MANAGE_DOCUMENTS", "VALIDATE_DOCUMENTS"]);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        verifiedById: admin.id,
        comment: comment || null,
      },
    });

    revalidatePath('/admin/documents');
    revalidatePath('/student/dashboard');

    return { success: true };
  } catch (error) {
    console.error("verifyDocumentAction error:", error);
    return { error: "Impossible de vérifier le document." };
  }
}

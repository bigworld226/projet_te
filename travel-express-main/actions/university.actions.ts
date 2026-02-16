'use server';

import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdminAction } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Créer ou mettre à jour une université
 * Champs FormData attendus :
 *   - id (optionnel, indique un update)
 *   - name, city, country, description, summary, tuitionFee, levels
 *   - images (File[])
 *   - existingImages (JSON string[] d'URLs à conserver)
 *   - pdf (File, optionnel)
 */
export async function saveUniversityAction(formData: FormData) {
  // Vérification IAM
  await requireAdminAction(["MANAGE_UNIVERSITIES"]);

  const id = formData.get('id') as string | null;
  const name = formData.get('name') as string;
  const city = formData.get('city') as string;
  const country = formData.get('country') as string;
  const description = formData.get('description') as string;
  const summary = formData.get('summary') as string;
  const tuitionFee = formData.get('tuitionFee') as string;
  const levels = formData.get('levels') as string;

  try {
    // ---------- Images ----------
    const imageFiles = formData.getAll('images') as File[];
    const uploadedImageUrls: string[] = [];

    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "travel_express/universities",
              resource_type: 'auto',
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        }).catch((err) => {
          console.error('Image upload error:', err);
          return null;
        });

        if (uploadResult) {
          const uploadedFile = uploadResult as any;
          uploadedImageUrls.push(uploadedFile.secure_url);
        }
      }
    }

    // Images existantes à conserver (mode édition)
    let existingImages: string[] = [];
    const existingImagesRaw = formData.get('existingImages') as string | null;
    if (existingImagesRaw) {
      try {
        existingImages = JSON.parse(existingImagesRaw);
      } catch {
        existingImages = [];
      }
    }

    const allImages = [...existingImages, ...uploadedImageUrls];

    // ---------- PDF ----------
    let pdfUrl: string | null = null;
    const pdfFile = formData.get('pdf') as File | null;

    if (pdfFile && pdfFile.size > 0) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "travel_express/universities/pdf",
            resource_type: 'auto',
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      }).catch((err) => {
        console.error('PDF upload error:', err);
        return null;
      });

      if (uploadResult) {
        const uploadedFile = uploadResult as any;
        pdfUrl = uploadedFile.secure_url;
      }
    }

    // ---------- Données Prisma ----------
    const data: any = {
      name,
      city,
      country,
      description,
      summary,
      costRange: tuitionFee,
      programs: levels,
      images: allImages,
    };

    if (allImages.length > 0) {
      data.imageUrl = allImages[0];
    }
    if (pdfUrl) {
      data.pdfUrl = pdfUrl;
    }

    if (id) {
      // Mode mise à jour
      await prisma.university.update({
        where: { id },
        data,
      });
    } else {
      // Mode création
      await prisma.university.create({ data });
    }

    revalidatePath('/admin/universities');
    return { success: true };
  } catch (error) {
    console.error("saveUniversityAction error:", error);
    return { success: false, error: "Impossible de sauvegarder l'université." };
  }
}

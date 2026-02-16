'use server'

import { cloudinary } from '@/lib/cloudinary';

export async function getFileUrl(filePath: string | null, folder = "travel_express") {
  if (!filePath) return null;

  try {
    // Si c'est déjà une URL Cloudinary, la retourner directement
    if (filePath.includes('cloudinary.com') || filePath.includes('res.cloudinary.com')) {
      return filePath;
    }

    // Si c'est un public_id Cloudinary (ex: travel_express/document_abc123)
    if (filePath.includes('/')) {
      return cloudinary.url(filePath, {
        secure: true,
        quality: 'auto',
        fetch_format: 'auto',
      });
    }

    return null;
  } catch (err) {
    console.error("❌ Erreur Cloudinary:", err);
    return null;
  }
}

export async function uploadFile(fileBuffer: Buffer, fileName: string, folder = "travel_express") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        public_id: fileName.split('.')[0],
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Erreur upload Cloudinary:", error);
          reject(error);
        } else {
          resolve(result?.public_id || result?.secure_url);
        }
      }
    );

    stream.end(fileBuffer);
  });
}
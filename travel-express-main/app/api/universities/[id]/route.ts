import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// Utilitaire pour gérer l'ID (String CUID vs Int)
const getWhereId = (id: string) => ({
  id: String(id) 
});

export async function GET(request: Request, context: any) {
  const { id } = await context.params;
  try {
    const university = await prisma.university.findUnique({ 
      where: getWhereId(id) 
    });
    return NextResponse.json({ university });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors du chargement." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  const { id } = await context.params;
  
  let name, city, summary, description, costRange, programs;
  let images: string[] = [];
  let documents: any[] = []; // On prépare le tableau des documents

  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");

  if (isMultipart) {
    const formData = await request.formData();
    
    // 1. Textes
    name = formData.get("name") as string;
    city = formData.get("city") as string;
    summary = formData.get("summary") as string;
    description = formData.get("description") as string;
    costRange = formData.get("costRange") as string;
    programs = formData.get("programs") as string;

    // 2. Gestion des IMAGES
    const oldImageUrls = (formData.getAll("oldImages") as string[]).filter(Boolean);
    const imagesFiles = formData.getAll("images").filter(Boolean);
    const newImageUrls: string[] = [];

    for (const img of imagesFiles) {
      if (img instanceof File) {
        const url = await uploadToSupabase(img, 'universities');
        if (url) newImageUrls.push(url);
      }
    }
    images = [...oldImageUrls, ...newImageUrls];

    // 3. Gestion des DOCUMENTS (Le correctif est ici)
    const oldDocsRaw = formData.get("oldDocuments");
    const oldDocs = oldDocsRaw ? JSON.parse(oldDocsRaw as string) : [];
    const documentFiles = formData.getAll("newDocuments").filter(Boolean);
    const newDocs = [];

    for (const doc of documentFiles) {
      if (doc instanceof File) {
        const url = await uploadToSupabase(doc, 'documents');
        if (url) {
          newDocs.push({ name: doc.name, url: url });
        }
      }
    }
    documents = [...oldDocs, ...newDocs];

  } else {
    const body = await request.json();
    ({ name, city, summary, description, costRange, programs, images, documents } = body);
  }

  try {
    const university = await prisma.university.update({
      where: getWhereId(id),
      data: {
        name, city, summary, description, costRange, programs,
        images,
        pdfUrl:Array.isArray(documents) ? documents[0] : documents, // On met à jour le champ documents en BDD
      },
    });
    return NextResponse.json({ university });
  } catch (error) {
    console.error("Erreur PUT:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

// Petit utilitaire pour éviter la répétition de code Supabase
async function uploadToSupabase(file: File, folder: string) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'file';
    const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    
    const { error } = await supabase.storage
      .from('agence')
      .upload(`${folder}/${fileName}`, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage.from('agence').getPublicUrl(`${folder}/${fileName}`);
    return data?.publicUrl;
  } catch (err) {
    console.error("Upload Error:", err);
    return null;
  }
}

export async function DELETE(request: Request, context: any) {
  const { id } = await context.params;
  try {
    // Grace à ta nouvelle structure :
    // 1. Les paiements ne sont PLUS liés à l'université, donc ils restent intacts.
    // 2. Les applications sont liées via universityId (optionnel). 
    // On va mettre à null universityId dans les applications liées avant de supprimer.
    
    await prisma.$transaction([
      prisma.application.updateMany({
        where: { universityId: id },
        data: { universityId: null }
      }),
      prisma.university.delete({
        where: getWhereId(id)
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression univ:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression. Vérifiez si des paiements y sont encore liés (vieux data)." }, { status: 500 });
  }
}


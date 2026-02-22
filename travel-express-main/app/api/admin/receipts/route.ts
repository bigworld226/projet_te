import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { DEFAULT_RECEIPT_TEMPLATES, getNextReceiptNumber, parseReceiptDetails } from "@/lib/receipts";
import { getFileUrl, uploadFile } from "@/lib/storage";

const RECEIPT_ROLES = new Set(["SUPERADMIN", "SECRETARY"]);
export const runtime = "nodejs";

async function getCurrentAdmin() {
  const session = await authService.getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: { select: { name: true } },
    },
  });

  if (!user || !RECEIPT_ROLES.has(user.role.name)) return null;
  return user;
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const [students, logs, templates] = await Promise.all([
      prisma.user.findMany({
        where: { role: { name: "STUDENT" } },
        select: { id: true, fullName: true, email: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.findMany({
        where: { targetType: "RECEIPT", action: "RECEIPT_GENERATED" },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          admin: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.activityLog.findMany({
        where: { targetType: "RECEIPT_TEMPLATE", action: "RECEIPT_TEMPLATE_CREATED" },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          admin: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    const receipts = await Promise.all(logs.map(async (log) => {
      const details = parseReceiptDetails(log.details);
      const templateUrl = details?.templateFilePath ? await getFileUrl(details.templateFilePath) : null;
      return {
        id: log.id,
        createdAt: log.createdAt,
        studentId: log.targetId,
        admin: log.admin,
        receiptNumber: details?.receiptNumber ?? null,
        receiptType: details?.receiptType ?? "Reçu",
        templateName: details?.templateName ?? "Modèle standard",
        templateId: details?.templateId ?? "default-simple",
        templateFileUrl: templateUrl,
        recipientName: details?.recipientName ?? "Étudiant",
        recipientEmail: details?.recipientEmail ?? "",
        amount: details?.amount ?? null,
        unitAmount: details?.unitAmount ?? null,
        amountPaid: details?.amountPaid ?? null,
        remainingAmount: details?.remainingAmount ?? 0,
        description: details?.description ?? "",
        note: details?.note ?? "",
      };
    }));

    const customTemplates = await Promise.all(templates.map(async (template) => {
      const details = parseReceiptDetails(template.details);
      const fileUrl = details?.filePath ? await getFileUrl(details.filePath) : null;
      return {
        id: template.id,
        name: details?.name ?? "Modèle personnalisé",
        description: details?.description ?? "",
        kind: "custom",
        createdAt: template.createdAt,
        fileUrl,
      };
    }));

    return NextResponse.json({
      receipts,
      students,
      currentRole: admin.role.name,
      canDeleteGeneratedReceipts: admin.role.name === "SUPERADMIN",
      templates: [...DEFAULT_RECEIPT_TEMPLATES, ...customTemplates],
    });
  } catch (error) {
    console.error("GET /api/admin/receipts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const name = String(form.get("name") || "").trim();
      const description = String(form.get("description") || "").trim();

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Fichier modèle requis" }, { status: 400 });
      }

      const allowed = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: "Formats autorisés: .doc, .docx" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = (await uploadFile(buffer, fileName, "travel_express/receipt_templates")) as string;

      const templateLog = await prisma.activityLog.create({
        data: {
          adminId: admin.id,
          action: "RECEIPT_TEMPLATE_CREATED",
          targetType: "RECEIPT_TEMPLATE",
          targetId: admin.id,
          details: JSON.stringify({
            name: name || file.name,
            description,
            filePath,
            originalFileName: file.name,
            uploadedAt: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        template: {
          id: templateLog.id,
          name: name || file.name,
          description,
        },
      });
    }

    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const receiptType = typeof body?.receiptType === "string" ? body.receiptType.trim() : "FACTURE";
    const templateId = typeof body?.templateId === "string" ? body.templateId : "default-simple";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : "Frais de traitement des dossiers pour la procédure d'obtention de bourse d'étude en Chine (Admission + JW + visa)";
    const amountRaw = body?.amount;
    const amount =
      amountRaw === undefined || amountRaw === null || amountRaw === ""
        ? null
        : Number(amountRaw);
    const unitAmountRaw = body?.unitAmount;
    const unitAmount =
      unitAmountRaw === undefined || unitAmountRaw === null || unitAmountRaw === ""
        ? amount
        : Number(unitAmountRaw);
    const amountPaidRaw = body?.amountPaid;
    const amountPaid =
      amountPaidRaw === undefined || amountPaidRaw === null || amountPaidRaw === ""
        ? amount
        : Number(amountPaidRaw);
    const remainingAmountRaw = body?.remainingAmount;
    const remainingAmount =
      remainingAmountRaw === undefined || remainingAmountRaw === null || remainingAmountRaw === ""
        ? 0
        : Number(remainingAmountRaw);

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur requis" }, { status: 400 });
    }
    if (amount !== null && Number.isNaN(amount)) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
    if (unitAmount !== null && Number.isNaN(unitAmount)) {
      return NextResponse.json({ error: "Montant unitaire invalide" }, { status: 400 });
    }
    if (amountPaid !== null && Number.isNaN(amountPaid)) {
      return NextResponse.json({ error: "Montant payé invalide" }, { status: 400 });
    }
    if (remainingAmount !== null && Number.isNaN(remainingAmount)) {
      return NextResponse.json({ error: "Montant restant invalide" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
    });

    if (!student || student.role.name !== "STUDENT") {
      return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
    }

    const isDefaultTemplate = templateId.startsWith("default-");
    let templateName = DEFAULT_RECEIPT_TEMPLATES.find((tpl) => tpl.id === templateId)?.name || "Modèle standard";
    let templateFilePath: string | null = null;

    if (!isDefaultTemplate) {
      const templateLog = await prisma.activityLog.findFirst({
        where: {
          id: templateId,
          targetType: "RECEIPT_TEMPLATE",
          action: "RECEIPT_TEMPLATE_CREATED",
        },
      });
      const templateDetails = parseReceiptDetails(templateLog?.details || null);
      if (!templateLog || !templateDetails?.filePath) {
        return NextResponse.json({ error: "Modèle personnalisé introuvable" }, { status: 404 });
      }
      templateName = templateDetails?.name || templateName;
      templateFilePath = templateDetails.filePath;
    }

    const receiptNumber = await getNextReceiptNumber();
    const details = {
      receiptNumber,
      templateId,
      templateName,
      templateFilePath,
      receiptType,
      description,
      recipientName: student.fullName || student.email,
      recipientEmail: student.email,
      amount,
      unitAmount,
      amountPaid,
      remainingAmount,
      note,
      issuedAt: new Date().toISOString(),
      issuedBy: admin.fullName || admin.email,
    };

    const receipt = await prisma.activityLog.create({
      data: {
        adminId: admin.id,
        action: "RECEIPT_GENERATED",
        targetType: "RECEIPT",
        targetId: student.id,
        details: JSON.stringify(details),
      },
    });

    return NextResponse.json({
      receipt: {
        id: receipt.id,
        createdAt: receipt.createdAt,
        ...details,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/receipts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

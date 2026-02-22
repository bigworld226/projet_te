import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { parseReceiptDetails } from "@/lib/receipts";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type ReceiptRow = {
  designation: string;
  qty: string;
  unit: string;
  total: string;
};

function pdfSafe(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ");
}

function formatXof(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function splitText(text: string, maxLength = 58) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLength) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function getRows(
  templateId: string,
  amount: number | null,
  customDescription?: string,
  customUnitAmount?: number | null,
  customTotalAmount?: number | null
): ReceiptRow[] {
  const baseAmount = typeof amount === "number" && amount > 0 ? amount : 400000;
  const description =
    customDescription && customDescription.trim().length > 0
      ? customDescription.trim()
      : "Frais de traitement des dossiers pour la procédure d'obtention de bourse d'étude en Chine (Admission + JW + visa)";
  const unitPrice = typeof customUnitAmount === "number" && customUnitAmount > 0 ? customUnitAmount : baseAmount;
  const totalPrice = typeof customTotalAmount === "number" && customTotalAmount >= 0 ? customTotalAmount : unitPrice;
  if (templateId === "default-complete") {
    return [
      {
        designation: description,
        qty: "01",
        unit: formatXof(unitPrice),
        total: formatXof(totalPrice),
      },
      {
        designation:
          "Authentification des documents, traduction, réservation du billet, introduction visa et suivi de demande",
        qty: "01",
        unit: formatXof(1200000),
        total: formatXof(1200000),
      },
      {
        designation: "Prestations complémentaires administratives",
        qty: "01",
        unit: formatXof(1200000),
        total: formatXof(1200000),
      },
    ];
  }
  return [
    {
      designation: description,
      qty: "01",
      unit: formatXof(unitPrice),
      total: formatXof(totalPrice),
    },
  ];
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await context.params;
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const receipt = await prisma.activityLog.findFirst({
      where: {
        id,
        action: "RECEIPT_GENERATED",
        targetType: "RECEIPT",
      },
      include: {
        admin: { select: { fullName: true, email: true } },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 });
    }

    const isOwner = receipt.targetId === currentUser.id;
    const canAdminAccess =
      currentUser.role.name === "SUPERADMIN" || currentUser.role.name === "SECRETARY";
    if (!isOwner && !canAdminAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const details = parseReceiptDetails(receipt.details);
    const receiptNumber = details?.receiptNumber ? String(details.receiptNumber) : "0";
    const type = details?.receiptType ?? "Reçu";
    const templateName = details?.templateName ?? "Modèle standard";
    const templateId = details?.templateId ?? "default-simple";
    const name = details?.recipientName ?? "Étudiant";
    const amountValue =
      details?.amount === null || details?.amount === undefined ? null : Number(details.amount);
    const unitAmountValue =
      details?.unitAmount === null || details?.unitAmount === undefined ? null : Number(details.unitAmount);
    const amountPaidValue =
      details?.amountPaid === null || details?.amountPaid === undefined ? amountValue : Number(details.amountPaid);
    const remainingAmountValue =
      details?.remainingAmount === null || details?.remainingAmount === undefined ? 0 : Number(details.remainingAmount);
    const descriptionValue = typeof details?.description === "string" ? details.description : "";
    const note = details?.note ? String(details.note) : "-";
    const issuedAt = details?.issuedAt ?? receipt.createdAt.toISOString();

    const rows = getRows(templateId, amountValue, descriptionValue, unitAmountValue, amountPaidValue);
    const total = rows.reduce((sum, row) => {
      const numeric = Number(row.total.replace(/[^\d]/g, ""));
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);

    // Background (white)
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    // Outer border
    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Header boxes
    page.drawRectangle({
      x: 22,
      y: height - 140,
      width: 300,
      height: 110,
      color: rgb(0.96, 0.96, 0.96),
    });
    page.drawRectangle({
      x: 322,
      y: height - 140,
      width: width - 344,
      height: 110,
      color: rgb(1, 1, 1),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    try {
      const logoBytes = await fs.readFile(logoPath);
      const logo = await pdf.embedPng(logoBytes);
      page.drawImage(logo, {
        x: width - 208,
        y: height - 134,
        width: 128,
        height: 100,
      });
    } catch {}

    const topRef = `RCCM: BF-BBD-01-2025-B13-00999 - IFU: ${String(receiptNumber).padStart(7, "0")}`;
    page.drawText(pdfSafe(topRef), { x: 28, y: height - 44, font: bold, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Secteur 29 Belleville, Rue Vicens section"), { x: 28, y: height - 58, font, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Bobo-Dioulasso, Burkina Faso"), { x: 28, y: height - 72, font: bold, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Tel : +226 65 60 45 92 / 51 35 92 49"), { x: 28, y: height - 86, font: bold, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Email : travelexpress031@gmail.com"), { x: 28, y: height - 100, font: bold, size: 8, color: rgb(0, 0, 0) });

    page.drawText(pdfSafe(`FACTURE N°${String(receiptNumber).padStart(4, "0")}`), {
      x: width / 2 - 68,
      y: height - 160,
      font: bold,
      size: 14,
      color: rgb(0, 0, 0),
    });

    // Meta
    page.drawText(pdfSafe(`Adresse : Bobo-Dioulasso`), { x: 90, y: height - 194, font, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Date : ${new Date(issuedAt).toLocaleDateString("fr-FR")}`), { x: 90, y: height - 212, font, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Email : ${details?.recipientEmail || "-"}`), { x: 90, y: height - 230, font, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Tel : +226 66604952 / 51359249`), { x: 90, y: height - 248, font, size: 9, color: rgb(0, 0, 0) });

    page.drawText(pdfSafe(`Nom : ${name}`), { x: 355, y: height - 194, font, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Type : ${type}`), { x: 355, y: height - 212, font, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Adresse : Bobo-Dioulasso`), { x: 355, y: height - 230, font, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Tel : (+226) 62626320`), { x: 355, y: height - 248, font, size: 9, color: rgb(0, 0, 0) });

    // Table
    const tableX = 86;
    const tableY = height - 290;
    const tableW = width - 170;
    const tableH = 380;
    page.drawRectangle({
      x: tableX,
      y: tableY - tableH,
      width: tableW,
      height: tableH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const c1 = tableX + Math.floor(tableW * 0.66);
    const c2 = tableX + Math.floor(tableW * 0.78);
    const c3 = tableX + Math.floor(tableW * 0.90);
    page.drawLine({ start: { x: c1, y: tableY }, end: { x: c1, y: tableY - tableH }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: c2, y: tableY }, end: { x: c2, y: tableY - tableH }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: c3, y: tableY }, end: { x: c3, y: tableY - tableH }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: tableX, y: tableY - 18 }, end: { x: tableX + tableW, y: tableY - 18 }, color: rgb(0, 0, 0), thickness: 1 });

    page.drawText(pdfSafe("Designation"), { x: tableX + 4, y: tableY - 14, font: bold, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Quantite"), { x: c1 + 4, y: tableY - 14, font: bold, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Prix unitaire"), { x: c2 + 4, y: tableY - 14, font: bold, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Prix total"), { x: c3 + 4, y: tableY - 14, font: bold, size: 8, color: rgb(0, 0, 0) });

    let y = tableY - 36;
    for (const row of rows) {
      const lines = splitText(row.designation, 62);
      for (const line of lines) {
        page.drawText(pdfSafe(line), { x: tableX + 6, y, font, size: 7.5, color: rgb(0, 0, 0) });
        y -= 11;
      }
      page.drawText(pdfSafe(row.qty), { x: c1 + 8, y: y + 11, font, size: 7, color: rgb(0, 0, 0) });
      page.drawText(pdfSafe(row.unit), { x: c2 + 4, y: y + 11, font, size: 7, color: rgb(0, 0, 0) });
      page.drawText(pdfSafe(row.total), { x: c3 + 3, y: y + 11, font: bold, size: 6.8, color: rgb(0, 0, 0) });
      y -= 16;
    }

    const sumY = tableY - tableH + 24;
    page.drawLine({ start: { x: tableX, y: sumY + 14 }, end: { x: tableX + tableW, y: sumY + 14 }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawText(pdfSafe(`Somme total verse : ${formatXof(Number.isFinite(amountPaidValue || 0) ? (amountPaidValue || 0) : total)}`), { x: tableX + 6, y: sumY + 5, font: bold, size: 8, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe(`Somme restant a verser : ${formatXof(Number.isFinite(remainingAmountValue || 0) ? (remainingAmountValue || 0) : 0)}`), { x: tableX + 6, y: sumY - 8, font: bold, size: 8, color: rgb(0, 0, 0) });

    page.drawText(pdfSafe("L'Entreprise :"), { x: tableX, y: 64, font, size: 9, color: rgb(0, 0, 0) });
    page.drawText(pdfSafe("Le client :"), { x: tableX + tableW - 90, y: 64, font, size: 9, color: rgb(0, 0, 0) });
    if (note && note !== "-") {
      page.drawText(pdfSafe(`Note: ${note}`), { x: tableX, y: 30, font, size: 8, color: rgb(0, 0, 0) });
    }

    const bytes = await pdf.save();
    const safeType = String(type).replace(/[^\w-]/g, "_");
    const safeNumber = String(receiptNumber).replace(/[^\d]/g, "") || "0";
    const filename = `recu_${safeNumber}_${safeType}.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/student/receipts/[id]/download error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

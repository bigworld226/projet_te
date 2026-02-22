import { prisma } from "@/lib/prisma";

export type DefaultReceiptTemplate = {
  id: string;
  name: string;
  description: string;
  kind: "default";
};

export const DEFAULT_RECEIPT_TEMPLATES: DefaultReceiptTemplate[] = [
  {
    id: "default-simple",
    name: "Modèle 1 - Facture admission/visa",
    description: "Basé sur ton premier schéma (frais de traitement + visa).",
    kind: "default",
  },
  {
    id: "default-complete",
    name: "Modèle 2 - Facture services complets",
    description: "Basé sur ton deuxième schéma (services détaillés).",
    kind: "default",
  },
];

export function parseReceiptDetails(details: string | null) {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

export async function getNextReceiptNumber() {
  const generated = await prisma.activityLog.findMany({
    where: {
      targetType: "RECEIPT",
      action: { in: ["RECEIPT_GENERATED", "RECEIPT_DELETED"] },
    },
    select: { details: true },
    take: 5000,
    orderBy: { createdAt: "desc" },
  });

  let maxNumber = 0;
  for (const row of generated) {
    const details = parseReceiptDetails(row.details);
    const number = Number(details?.receiptNumber || 0);
    if (Number.isFinite(number) && number > maxNumber) {
      maxNumber = number;
    }
  }
  return maxNumber + 1;
}

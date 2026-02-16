'use server';

import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Récupère tous les frais par pays
 */
export async function getFeesAction() {
  await requireAdminAction(["MANAGE_FINANCES"]);

  const fees = await prisma.feesByCountry.findMany({
    orderBy: { country: 'asc' },
  });

  return fees;
}

/**
 * Créer ou mettre à jour des frais par pays
 * FormData : id (optionnel), country, amount
 */
export async function updateFeeAction(formData: FormData) {
  await requireAdminAction(["MANAGE_FINANCES"]);

  const id = formData.get('id') as string | null;
  const country = formData.get('country') as string;
  const amount = parseFloat(formData.get('amount') as string);

  if (!country || isNaN(amount)) {
    return { success: false, error: "Pays et montant sont requis." };
  }

  try {
    if (id) {
      await prisma.feesByCountry.update({
        where: { id },
        data: { country, amount },
      });
    } else {
      await prisma.feesByCountry.create({
        data: { country, amount },
      });
    }

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error("updateFeeAction error:", error);
    return { success: false, error: "Impossible de sauvegarder les frais." };
  }
}

/**
 * Supprimer des frais par pays
 */
export async function deleteFeeAction(feeId: string) {
  await requireAdminAction(["MANAGE_FINANCES"]);

  try {
    await prisma.feesByCountry.delete({
      where: { id: feeId },
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error("deleteFeeAction error:", error);
    return { success: false, error: "Impossible de supprimer les frais." };
  }
}

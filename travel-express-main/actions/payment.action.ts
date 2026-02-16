'use server';

import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";

/**
 * Met à jour le statut d'un paiement
 */
export async function updatePaymentAction(paymentId: string, status: PaymentStatus) {
  await requireAdminAction(["MANAGE_FINANCES"]);

  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });

    revalidatePath('/admin/finances');
    return { success: true };
  } catch (error) {
    console.error("updatePaymentAction error:", error);
    return { success: false, error: "Impossible de mettre à jour le paiement." };
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // On précise que params est une Promise
) {
  try {
    // 1. INDISPENSABLE : On attend que les params soient résolus
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return new NextResponse("ID manquant", { status: 400 });
    }

    // 2. Requête Prisma corrigée
    const payment = await prisma.payment.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        application: {
          include: {
            university: {
              select: {
                name: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return new NextResponse("Paiement introuvable", { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("[PAYMENT_GET_ERROR]", error);
    return new NextResponse("Erreur Interne", { status: 500 });
  }
}
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    const adminPut = await requireAdminWithPermission(["MANAGE_FINANCES"]);
    if (!adminPut) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const {
            amount,
            currency,
            userId,
            applicationId, // Le nouveau pivot
            method,
            status,
            reference
        } = await req.json();

        // Validation stricte : un paiement doit appartenir à un user et un dossier
        if (!amount || !userId || !applicationId || !method || !status) {
            return NextResponse.json(
                { error: "Champs obligatoires manquants (amount, userId, applicationId, method, status)" }, 
                { status: 400 }
            );
        }

        const updatedPayment = await prisma.payment.update({
            where: { id: id },
            data: {
                amount: Number(amount),
                currency: currency || "XOF",
                userId,
                applicationId, // On lie officiellement au dossier
                method,
                status,
                reference: reference || null
            },
        });

        return NextResponse.json(updatedPayment);
    } catch (error: any) {
        console.error("[PAYMENT_UPDATE_ERROR]", error);
        return NextResponse.json({ error: "Erreur lors de la mise à jour du paiement" }, { status: 500 });
    }
}



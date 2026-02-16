import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminWithPermission } from "@/lib/permissions";

export async function GET() {
  // Seul ALL_ACCESS peut voir le journal d'activités complet
  const admin = await requireAdminWithPermission(["ALL_ACCESS"]);
  if (!admin) {
    return NextResponse.json({ 
      error: "Accès refusé",
      message: "Seul l'administrateur principal (SUPERADMIN) peut consulter le journal complet des activités."
    }, { status: 403 });
  }

  // Récupère les dernières activités (documents, candidatures, logs...)
  const [docs, apps, activityLogs] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        application: { include: { user: true } },
        verifiedBy: { select: { fullName: true } }
      }
    }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true, university: true }
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { admin: { select: { fullName: true } } }
    })
  ]);

  // Mappe les documents en activités
  const docActivities = docs.map(doc => ({
    id: doc.id,
    type:
      doc.status === "APPROVED" ? "DOC_VERIFIED" :
      doc.status === "REJECTED" ? "DOC_REJECTED" :
      "DOC_NEW",
    title: doc.name,
    description:
      doc.status === "APPROVED"
        ? `Document validé pour ${doc.application?.user?.fullName || 'un étudiant'}${doc.verifiedBy ? ` par ${doc.verifiedBy.fullName}` : ''}`
        : doc.status === "REJECTED"
        ? `Document rejeté pour ${doc.application?.user?.fullName || 'un étudiant'}${doc.verifiedBy ? ` par ${doc.verifiedBy.fullName}` : ''}`
        : `Nouveau document soumis par ${doc.application?.user?.fullName || 'un étudiant'}`,
    date: doc.createdAt,
    user: doc.application?.user?.fullName || 'Inconnu',
    color:
      doc.status === "APPROVED" ? "bg-green-500" :
      doc.status === "REJECTED" ? "bg-red-500" :
      "bg-purple-500",
  }));

  // Mappe les candidatures en activités
  const appActivities = apps.map(app => ({
    id: app.id,
    type: app.status === "SUBMITTED" ? "APP_NEW" : "APP_UPDATE",
    title: app.university?.name ? `Candidature - ${app.university.name}` : "Nouvelle candidature",
    description:
      app.status === "SUBMITTED"
        ? `${app.user?.fullName || 'Un étudiant'} a soumis une nouvelle candidature.`
        : `${app.user?.fullName || 'Un étudiant'} a mis à jour sa candidature.`,
    date: app.createdAt,
    user: app.user?.fullName || 'Inconnu',
    color: app.status === "SUBMITTED" ? "bg-blue-500" : "bg-blue-400",
  }));

  // Mappe les logs d'activité admin
  const logActivities = activityLogs.map(log => ({
    id: log.id,
    type: log.action,
    title: log.action,
    description: log.details || `Action ${log.action} sur ${log.targetType || 'ressource'}`,
    date: log.createdAt,
    user: log.admin?.fullName || 'Admin',
    color: "bg-slate-500",
  }));

  // Fusionne et trie toutes les activités par date décroissante
  const activities = [...docActivities, ...appActivities, ...logActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ activities });
}

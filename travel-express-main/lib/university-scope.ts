import { prisma } from "@/lib/prisma";

export async function getPrimaryUniversityIdForUser(userId: string): Promise<string | null> {
  const latestApp = await prisma.application.findFirst({
    where: { userId, universityId: { not: null } },
    select: { universityId: true },
    orderBy: { updatedAt: "desc" },
  });
  return latestApp?.universityId || null;
}

export async function getUniversityIdsForUsers(userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  const apps = await prisma.application.findMany({
    where: {
      userId: { in: userIds },
      universityId: { not: null },
    },
    select: { userId: true, universityId: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const map = new Map<string, string>();
  for (const app of apps) {
    if (!app.universityId) continue;
    if (!map.has(app.userId)) {
      map.set(app.userId, app.universityId);
    }
  }
  return map;
}

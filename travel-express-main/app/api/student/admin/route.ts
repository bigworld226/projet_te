import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getPrimaryUniversityIdForUser } from "@/lib/university-scope";

/**
 * GET /api/student/admin
 * Returns the Super Admin (Assistant Social) for the student interface
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
        }

        const studentUniversityId = await getPrimaryUniversityIdForUser(payload.id);

        // Priorité au Student Mentor de la même université, sinon fallback Super Admin
        let advisor = studentUniversityId
          ? await prisma.user.findFirst({
              where: {
                role: { name: "STUDENT_MENTOR" },
                applications: { some: { universityId: studentUniversityId } },
              },
              select: {
                id: true,
                fullName: true,
                email: true,
                profileImage: true,
                role: { select: { name: true } },
              },
            })
          : null;

        if (!advisor) {
          advisor = await prisma.user.findFirst({
            where: {
                role: {
                    name: "SUPERADMIN"
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                profileImage: true,
                role: {
                    select: {
                        name: true
                    }
                }
            }
          });
        }

        if (!advisor) {
            return NextResponse.json({ success: false, message: "Aucun conseiller trouvé" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            admin: {
                ...advisor,
                displayName: advisor.fullName || "Conseiller"
            }
        });
    } catch (error) {
        console.error("❌ Error fetching Super Admin:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

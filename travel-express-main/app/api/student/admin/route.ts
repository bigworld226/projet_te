import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

        // Find the Super Admin user
        const superAdmin = await prisma.user.findFirst({
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

        if (!superAdmin) {
            return NextResponse.json({ success: false, message: "Super Admin not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            admin: {
                ...superAdmin,
                displayName: "Assistant Social"
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

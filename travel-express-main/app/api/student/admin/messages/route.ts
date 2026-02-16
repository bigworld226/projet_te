import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/student/admin/messages
 * Get all messages between the student and the Super Admin
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

        const userId = payload.id || (payload as any).userId;
        if (!userId) {
            console.error("[GET] userId is undefined in token", payload);
            return NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 401 });
        }

        // Find Super Admin
        const superAdmin = await prisma.user.findFirst({
            where: {
                role: {
                    name: "SUPERADMIN"
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });

        if (!superAdmin) {
            return NextResponse.json({ success: false, message: "Super Admin not found" }, { status: 404 });
        }

        // Find or create conversation with Super Admin
        // Find conversation where both the student and admin are participants
        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId } } },
                    { participants: { some: { userId: superAdmin.id } } }
                ]
            },
            select: {
                id: true
            }
        });

        // If no conversation exists, create one
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    subject: `Conversation avec ${superAdmin.fullName}`,
                    participants: {
                        create: [
                            { userId },
                            { userId: superAdmin.id }
                        ]
                    }
                },
                select: {
                    id: true
                }
            });
        }

        // Get all messages in the conversation
        const messages = await prisma.message.findMany({
            where: {
                conversationId: conversation.id
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        // Marquer la conversation comme lue pour l'étudiant courant
        await prisma.conversationParticipant.updateMany({
            where: {
                conversationId: conversation.id,
                userId
            },
            data: {
                lastRead: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            conversationId: conversation.id,
            messages: messages.map(msg => ({
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                sender: msg.sender,
                content: msg.content,
                attachments: msg.attachments,
                createdAt: msg.createdAt
            }))
        });
    } catch (error) {
        console.error("[GET /api/student/admin/messages]", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/student/admin/messages
 * Send a message to the Super Admin
 */
export async function POST(req: NextRequest) {
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

        const userId = payload.id || (payload as any).userId;
        if (!userId) {
            console.error("[POST] userId is undefined in token", payload);
            return NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 401 });
        }

        const { content, attachments } = await req.json();

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ success: false, message: "Message content is required" }, { status: 400 });
        }

        // Find Super Admin
        const superAdmin = await prisma.user.findFirst({
            where: {
                role: {
                    name: "SUPERADMIN"
                }
            },
            select: {
                id: true
            }
        });

        if (!superAdmin) {
            return NextResponse.json({ success: false, message: "Super Admin not found" }, { status: 404 });
        }

        // Find or create conversation
        // Find conversation where both the student and admin are participants
        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId } } },
                    { participants: { some: { userId: superAdmin.id } } }
                ]
            },
            select: {
                id: true
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    subject: "Conversation avec l'Assistant Social",
                    participants: {
                        create: [
                            { userId },
                            { userId: superAdmin.id }
                        ]
                    }
                },
                select: {
                    id: true
                }
            });
        }

        // Create the message
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                content: content || "",
                attachments: attachments || []
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                sender: message.sender,
                content: message.content,
                attachments: message.attachments,
                createdAt: message.createdAt
            }
        }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/student/admin/messages]", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        const convs = await prisma.conversationParticipant.findMany({
            where: { userId }
        });

        let unreadCount = 0;
        for (const conv of convs) {
            const unread = await prisma.message.count({
                where: {
                    conversationId: conv.conversationId,
                    senderId: { not: userId },
                    createdAt: {
                        gt: conv.lastRead
                    }
                }
            });
            unreadCount += unread;
        }

        return NextResponse.json({ unreadCount });
    } catch (err) {
        return NextResponse.json({ unreadCount: 0 });
    }
}

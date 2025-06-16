import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all study guides for the user
    const studyGuides = await prisma.chatConversation.findMany({
      where: {
        userId: user.id,
        type: "STUDY_GUIDE",
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Format the response
    const formattedGuides = studyGuides.map((guide) => ({
      id: guide.id,
      title: guide.title || "Untitled Study Guide",
      content: guide.messages[0]?.content || "",
      createdAt: guide.createdAt,
    }));

    return NextResponse.json({
      studyGuides: formattedGuides,
    });
  } catch (error) {
    console.error("Error fetching study guides:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch study guides",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

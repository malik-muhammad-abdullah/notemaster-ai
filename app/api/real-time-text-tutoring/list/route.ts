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

    // Get all tutorials for the user
    const tutorials = await prisma.chatConversation.findMany({
      where: {
        userId: user.id,
        type: "REAL_TIME_TEXT_TUTORING",
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
    const formattedTutorials = tutorials.map((tutorial) => ({
      id: tutorial.id,
      title: tutorial.title || "Untitled Tutorial",
      content: tutorial.messages[0]?.content || "",
      createdAt: tutorial.createdAt,
    }));

    return NextResponse.json({
      tutorials: formattedTutorials,
    });
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tutorials",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";
import { queryVectorStore } from "@/lib/query-vectors";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { query, topK } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: "No query provided" },
        { status: 400 }
      );
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Perform the vector search
    const results = await queryVectorStore(
      query,
      user.id,
      topK || 5
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Vector search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
} 
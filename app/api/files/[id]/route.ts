import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { deleteVectorEmbeddings } from "@/lib/vectorstore";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the file record
    const file = await prisma.fileUpload.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Verify the file belongs to the user
    if (file.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract the key from the fileUrl
    // The URL format is: https://bucket-name.s3.region.amazonaws.com/user-email/filename
    const fileUrl = new URL(file.fileUrl);
    const key = decodeURIComponent(fileUrl.pathname.substring(1)); // Remove leading slash and decode URL

    console.log('Deleting file from S3:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key: key
    });

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    try {
      await s3Client.send(deleteCommand);
      console.log('Successfully deleted from S3');
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // Continue with database deletion even if S3 deletion fails
      // This prevents orphaned database records
    }

    // Delete vector embeddings from Pinecone
    try {
      await deleteVectorEmbeddings(file.userId, file.filename);
      console.log('Successfully deleted vector embeddings from Pinecone');
    } catch (vectorError) {
      console.error('Vector deletion error:', vectorError);
      // Continue with database deletion even if vector deletion fails
      // This prevents orphaned database records
    }

    // Delete from database
    await prisma.fileUpload.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
} 
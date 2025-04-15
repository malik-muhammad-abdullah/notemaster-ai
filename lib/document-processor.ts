import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getPineconeIndex } from "./vectorstore";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import mammoth from "mammoth";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export async function processDocument(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  userId: string
) {
  try {
    // 1. Load document
    let docs: Document[] = [];

    // Handle different file types
    if (fileType === "application/pdf") {
      // For PDF files
      const blob = new Blob([fileBuffer], { type: "application/pdf" });
      const loader = new WebPDFLoader(blob);
      docs = await loader.load();
    } else if (fileType === "text/plain") {
      // For plain text files
      const text = fileBuffer.toString("utf-8");
      docs = [
        new Document({
          pageContent: text,
          metadata: {
            source: fileName,
          },
        }),
      ];
    } else if (
      fileType === "application/msword" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For Word documents
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      docs = [
        new Document({
          pageContent: result.value,
          metadata: {
            source: fileName,
          },
        }),
      ];
    } else if (
      fileType === "application/vnd.ms-powerpoint" ||
      fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      // For PowerPoint files - currently not supported
      throw new Error("PowerPoint files are not supported yet");
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // 2. Split documents into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);

    // Add userId to metadata
    const docsWithUserId = splitDocs.map((doc: Document) => {
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          userId: userId,
          fileName: fileName,
        },
      };
    });

    // 3. Create embeddings and insert into Pinecone
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-large"
    });

    const index = await getPineconeIndex();

    // Store documents in Pinecone
    await PineconeStore.fromDocuments(docsWithUserId, embeddings, {
      pineconeIndex: index,
      namespace: "notemaster", // Using a single namespace for all users
    });

    return {
      success: true,
      chunksCount: docsWithUserId.length,
    };
  } catch (error) {
    console.error("Error processing document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
} 
import { OpenAIEmbeddings } from "@langchain/openai";
import { getPineconeIndex } from "./vectorstore";
import { PineconeStore } from "@langchain/pinecone";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export async function queryVectorStore(query: string, userId: string, topK: number = 5) {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-large"
    });

    const index = await getPineconeIndex();

    // Create vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: "notemaster",
      filter: { userId }, // Only get documents for this user
    });

    // Search for similar documents
    const results = await vectorStore.similaritySearch(query, topK);

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Error querying vector store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
} 
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set in environment variables');
}

if (!process.env.PINECONE_ENVIRONMENT) {
  throw new Error('PINECONE_ENVIRONMENT is not set in environment variables');
}

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('PINECONE_INDEX_NAME is not set in environment variables');
}

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

export const getPineconeIndex = async () => {
  const client = getPineconeClient();
  return client.index(process.env.PINECONE_INDEX_NAME!);
};

export const deleteVectorEmbeddings = async (userId: string, fileName: string) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    
    console.log('Attempting to delete vectors with metadata:', { userId, fileName });
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-large"
    });

    const index = await getPineconeIndex();

    // Create vector store with the filter directly in the constructor
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: "notemaster",
    });
    
    // Call the delete method on the vector store
    console.log('Calling vectorStore.delete with filter:', { userId, fileName });
    await vectorStore.delete({ 
      filter: { 
        userId: userId.toString(), 
        fileName: fileName 
      } 
    });
    
    console.log(`Successfully deleted vectors for file ${fileName} of user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting vector embeddings:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}; 
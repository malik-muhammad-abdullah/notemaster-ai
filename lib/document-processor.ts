import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getPineconeIndex } from "./vectorstore";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import mammoth from "mammoth";
import AdmZip from 'adm-zip';
import { DOMParser } from '@xmldom/xmldom';

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
      fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      // For PPTX files - these are actually zip files with XML content
      try {
        console.log("Attempting to parse PPTX file...");
        
        // Read the .pptx file as a zip
        const zip = new AdmZip(fileBuffer);
        let slideText = '';
        
        // Find all slide XML entries
        const slideEntries = zip.getEntries().filter((entry: AdmZip.IZipEntry) => 
          entry.entryName.startsWith('ppt/slides/slide') && 
          entry.entryName.endsWith('.xml')
        );
        
        console.log(`Found ${slideEntries.length} slides in the presentation`);
        
        // Sort the slides by their number to maintain order
        slideEntries.sort((a: AdmZip.IZipEntry, b: AdmZip.IZipEntry) => {
          const numA = parseInt(a.entryName.replace(/\D/g, ''));
          const numB = parseInt(b.entryName.replace(/\D/g, ''));
          return numA - numB;
        });
        
        // Process each slide
        slideEntries.forEach((entry: AdmZip.IZipEntry, index: number) => {
          const slideContent = zip.readAsText(entry);
          slideText += `Slide ${index + 1}:\n`;
          
          // Use XML DOM to extract text content
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(slideContent, 'text/xml');
          
          // Extract text from all "a:t" elements (text elements in OOXML)
          const textNodes = xmlDoc.getElementsByTagName('a:t');
          for (let i = 0; i < textNodes.length; i++) {
            const text = textNodes[i].textContent;
            if (text && text.trim()) {
              slideText += text.trim() + '\n';
            }
          }
          
          slideText += '\n';
        });
        
        console.log(`Extracted ${slideText.length} characters of text from the presentation`);
        
        if (slideText.trim().length > 0) {
          docs = [
            new Document({
              pageContent: slideText,
              metadata: {
                source: fileName,
              },
            }),
          ];
        } else {
          throw new Error("No text content found in the PowerPoint file");
        }
      } catch (error) {
        console.error("Error parsing PPTX:", error);
        throw new Error(`Failed to parse PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (
      fileType === "application/vnd.ms-powerpoint"
    ) {
      // For older PPT files (not supported)
      throw new Error("Older PowerPoint (.ppt) files are not supported. Please convert to .pptx");
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
      // Clean up metadata to ensure it only contains supported types
      const cleanMetadata: Record<string, string | number | boolean> = {
        ...doc.metadata,
        userId: userId,
        fileName: fileName,
      };
      
      // Remove any complex objects from metadata
      Object.keys(cleanMetadata).forEach(key => {
        if (typeof cleanMetadata[key] === 'object' && cleanMetadata[key] !== null) {
          delete cleanMetadata[key];
        }
      });

      return {
        ...doc,
        metadata: cleanMetadata,
      };
    });

    // 3. Create embeddings and insert into Pinecone
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-large"
    });

    const index = await getPineconeIndex();
    
    console.log(`Uploading ${docsWithUserId.length} document chunks to Pinecone...`);

    try {
      // Store documents in Pinecone
      await PineconeStore.fromDocuments(docsWithUserId, embeddings, {
        pineconeIndex: index,
        namespace: "notemaster", // Using a single namespace for all users
      });
      console.log("Documents successfully uploaded to Pinecone");
    } catch (pineconeError) {
      console.error("Error uploading to Pinecone:", pineconeError);
      throw pineconeError;
    }

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
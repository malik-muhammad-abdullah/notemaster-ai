import mammoth from "mammoth";
import AdmZip from 'adm-zip';
import { DOMParser } from '@xmldom/xmldom';
import { Document } from "@langchain/core/documents";

/**
 * Extracts text content from various file types
 * @param fileBuffer The file buffer
 * @param fileType The MIME type of the file
 * @param fileName Optional filename for metadata
 * @returns The extracted text content or null if extraction failed
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  fileType: string,
  fileName: string = "document"
): Promise<string | null> {
  try {
    let textContent = "";

    // Handle different file types
    if (fileType === "application/pdf") {
      // For PDF files - need to dynamically import WebPDFLoader to avoid server-side errors
      // with Blob in Next.js
      const { WebPDFLoader } = await import("@langchain/community/document_loaders/web/pdf");
      const blob = new Blob([fileBuffer], { type: "application/pdf" });
      const loader = new WebPDFLoader(blob);
      const docs = await loader.load();
      textContent = docs.map(doc => doc.pageContent).join("\n\n");
      
    } else if (fileType === "text/plain") {
      // For plain text files
      textContent = fileBuffer.toString("utf-8");
      
    } else if (
      fileType === "application/msword" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For Word documents
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      textContent = result.value;
      
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
          textContent = slideText;
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

    return textContent;
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return null;
  }
}

/**
 * Creates a LangChain Document from file content
 * This is useful if you want to use the document with LangChain chains
 * @param fileBuffer The file buffer
 * @param fileType The MIME type of the file
 * @param fileName Filename for document metadata
 * @returns A LangChain Document object containing the file text content
 */
export async function fileToDocument(
  fileBuffer: Buffer,
  fileType: string,
  fileName: string
): Promise<Document | null> {
  try {
    const textContent = await extractTextFromFile(fileBuffer, fileType, fileName);
    
    if (!textContent) {
      return null;
    }
    
    return new Document({
      pageContent: textContent,
      metadata: {
        source: fileName,
      },
    });
  } catch (error) {
    console.error("Error converting file to document:", error);
    return null;
  }
} 
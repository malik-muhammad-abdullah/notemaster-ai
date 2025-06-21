import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Font,
  pdf,
  PageProps,
} from "@react-pdf/renderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

// Register fonts for regular and bold text
Font.register({
  family: "Times New Roman",
  src: "/fonts/times-new-roman.ttf",
});

Font.register({
  family: "Times New Roman Bold",
  src: "/fonts/times-new-roman-bold.ttf",
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    paddingBottom: 60, // Increase bottom padding to make room for footer
    fontFamily: "Times-Roman",
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: "Times-Roman",
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  h1: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 12,
    fontFamily: "Times-Roman",
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  h2: {
    fontSize: 18,
    marginTop: 14,
    marginBottom: 10,
    fontFamily: "Times-Roman",
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  h3: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
    fontFamily: "Times-Roman",
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 1.5,
    fontFamily: "Times-Roman",
  },
  bulletList: {
    marginLeft: 15,
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 1.5,
    flexDirection: "row",
  },
  bulletLevel1: {
    marginLeft: 15,
  },
  bulletLevel2: {
    marginLeft: 30,
  },
  bulletLevel3: {
    marginLeft: 45,
  },
  bullet: {
    width: 10,
    fontSize: 12,
    fontFamily: "Times-Roman",
  },
  bulletText: {
    flex: 1,
  },
  bold: {
    fontFamily: "Times-Roman",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: "#6b7280", // Gray color
    fontFamily: "Times-Roman",
  },
  footerBrand: {
    fontSize: 10,
    color: "#3b82f6", // Blue color
    fontFamily: "Times-Roman",
    fontWeight: "bold",
  },
});

interface PdfExportProps {
  content: string;
  title: string;
}

interface ProcessedLine {
  type: string;
  content: string;
  level?: number;
  indentLevel?: number;
}

const processMarkdownLine = (line: string): ProcessedLine => {
  // Headers
  const headerMatch = line.match(/^(#{1,6})\s(.+)$/);
  if (headerMatch) {
    return {
      type: "header",
      content: headerMatch[2],
      level: headerMatch[1].length,
    };
  }

  // Count leading spaces to determine indentation level
  const leadingSpacesMatch = line.match(/^(\s*)/);
  const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[0].length : 0;
  const indentLevel = Math.floor(leadingSpaces / 2); // 2 spaces = 1 indent level

  // Bullet points
  if (line.trim().startsWith("* ")) {
    return {
      type: "bullet",
      content: line.trim().substring(2),
      indentLevel,
    };
  }

  // Regular paragraph
  return {
    type: "paragraph",
    content: line,
    indentLevel: 0,
  };
};

const processBoldText = (
  text: string
): (string | { type: "bold"; content: string })[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return { type: "bold", content: boldMatch[1] };
    }
    return part;
  });
};

const RenderText: React.FC<{ content: string; style?: any }> = ({
  content,
  style,
}) => {
  const parts = processBoldText(content);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return part;
        }
        return (
          <Text key={index} style={styles.bold}>
            {part.content}
          </Text>
        );
      })}
    </Text>
  );
};

interface RenderProps {
  pageNumber: number;
  totalPages: number;
}

const PdfDocument: React.FC<PdfExportProps> = ({ content, title }) => {
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  const processedLines = lines.map(processMarkdownLine);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{title}</Text>

          {processedLines.map((line, index) => {
            switch (line.type) {
              case "header":
                const headerStyle =
                  styles[`h${line.level}` as keyof typeof styles] || styles.h1;
                return (
                  <RenderText
                    key={index}
                    content={line.content}
                    style={headerStyle}
                  />
                );

              case "bullet":
                const indentStyle = line.indentLevel
                  ? styles[
                      `bulletLevel${line.indentLevel}` as keyof typeof styles
                    ]
                  : {};
                return (
                  <View key={index} style={[styles.bulletItem, indentStyle]}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={styles.bulletText}>
                      <RenderText
                        content={line.content}
                        style={styles.paragraph}
                      />
                    </View>
                  </View>
                );

              default:
                return (
                  <RenderText
                    key={index}
                    content={line.content}
                    style={styles.paragraph}
                  />
                );
            }
          })}
        </View>
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Generated by NoteMaster AI</Text>
          <Text
            fixed
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export const PdfExportButton: React.FC<
  PdfExportProps & { className?: string }
> = ({ content, title, className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate the PDF blob
      const blob = await pdf(
        <PdfDocument content={content} title={title} />
      ).toBlob();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            <span>Export as PDF</span>
          </>
        )}
      </button>

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function FileUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const { data: session } = useSession();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setUploadStatus("Uploading...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadStatus("Upload successful! File URL: " + data.url);
      setFile(null);
    } catch (error) {
      setUploadStatus("Upload failed. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Please sign in to upload files.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">File Upload</h1>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full"
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Selected file: {file.name}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className={`w-full py-2 px-4 rounded-md text-white ${
              !file || uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {uploadStatus && (
          <div className="mt-4 p-4 rounded-md bg-gray-100 dark:bg-gray-700">
            <p className="text-sm">{uploadStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}

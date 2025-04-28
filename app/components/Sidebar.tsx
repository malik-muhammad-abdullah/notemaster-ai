"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FileUpload {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [userFiles, setUserFiles] = useState<FileUpload[]>([]);
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserFiles();
    }
  }, [session]);

  const fetchUserFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setUserFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      setIsUploading(true);
      setUploadStatus("Uploading...");
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }
      
      setUploadStatus("Upload successful!");
      fetchUserFiles(); // Refresh the file list
      
      // Reset the file input
      e.target.value = '';
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }
    
    try {
      setDeletingFileId(fileId);
      
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      
      // Remove the file from local state
      setUserFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div
      className={`sidebar fixed top-16 bottom-0 left-0 w-64 bg-gray-100 dark:bg-gray-800 shadow-lg transition-all duration-300 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } z-40`}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Your Files</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <svg 
              className="w-5 h-5 text-gray-500 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {status === "authenticated" ? (
          <>
            {/* File upload section */}
            <div className="mb-4">
              <label
                htmlFor="fileUpload"
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {isUploading ? "Uploading..." : "Upload New File"}
              </label>
              <input
                id="fileUpload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
              {uploadStatus && (
                <p className={`mt-2 text-sm ${
                  uploadStatus.includes("successful") 
                    ? "text-green-600" 
                    : uploadStatus === "Uploading..." 
                      ? "text-gray-600" 
                      : "text-red-600"
                }`}>
                  {uploadStatus}
                </p>
              )}
            </div>
            
            {/* Files list */}
            <div className="flex-grow overflow-y-auto">
              {userFiles.length === 0 ? (
                <p className="text-gray-500 text-sm">No files uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {userFiles.map((file) => (
                    <li key={file.id} className="bg-white dark:bg-gray-700 rounded p-2 shadow-sm flex items-center">
                      <div className="flex-grow mr-2">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:text-blue-600 text-sm truncate"
                          title={file.filename}
                        >
                          {file.filename}
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        disabled={deletingFileId === file.id}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors flex-shrink-0 self-center"
                        title="Delete file"
                      >
                        {deletingFileId === file.id ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Footer with link to file management */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/file-upload" 
                className="text-blue-600 text-sm hover:underline"
              >
                Manage All Files
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center">
            <svg 
              className="w-16 h-16 text-gray-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Sign in to upload and manage your files
            </p>
            <Link
              href="/api/auth/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 
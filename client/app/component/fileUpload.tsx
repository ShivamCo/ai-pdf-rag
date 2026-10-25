"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

interface FileUploadProps {
  onUploadSuccess?: (docId?: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ onUploadSuccess, disabled }: FileUploadProps) {
  const { getToken, userId } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF document (.pdf).");
      return;
    }

    // Limit file size to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File size exceeds 25MB limit. Please upload a smaller PDF.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadStep("Uploading file to cloud storage...");

    const formData = new FormData();
    formData.append("pdf", file);
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL_PDF ||
      "http://localhost:8080";

    try {
      const token = await getToken();

      const response = await axios.post(`${apiUrl}/api/upload-document`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...(userId ? { "x-user-id": userId } : {}),
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadStep("Completed!");
      if (onUploadSuccess) {
        onUploadSuccess(response.data?.data?.document?.id);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const msg =
        error?.response?.data?.message ||
        "Failed to upload PDF. Please check your connection and try again.";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setUploadStep("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={() => {
          if (!disabled && !isUploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-[180px] w-full select-none flex-col items-center justify-center border border-dashed p-6 text-center transition ${
          disabled || isUploading
            ? "cursor-not-allowed border-rule text-muted"
            : isDragging
            ? "cursor-copy border-accent bg-accent/5"
            : "cursor-pointer border-rule hover:border-ink"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <p className="font-serif text-2xl italic">
              Reading<span className="animate-caret">_</span>
            </p>
            <p className="font-mono text-[11px] text-muted">{uploadStep}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className={`font-serif text-3xl ${isDragging ? "italic text-accent" : ""}`}>
              {isDragging ? "Let go." : "Drop a PDF here"}
            </p>
            <p className="text-sm text-muted">
              or <span className="text-ink underline decoration-rule underline-offset-4">browse your files</span>
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              pdf only · 25 mb max · 5 documents
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 flex w-full items-start gap-3 border-l-2 border-accent py-1 pl-3 text-sm text-accent">
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="cursor-pointer font-mono text-xs text-muted hover:text-ink"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

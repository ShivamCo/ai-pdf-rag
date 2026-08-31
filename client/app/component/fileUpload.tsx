"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

interface FileUploadProps {
  onUploadSuccess?: () => void;
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL_PDF || "http://localhost:5300";

    try {
      const token = await getToken();

      setUploadStep("Queueing background processing & vector embeddings...");

      await axios.post(`${apiUrl}/api/upload-document`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...(userId ? { "x-user-id": userId } : {}),
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadStep("Completed!");
      if (onUploadSuccess) {
        onUploadSuccess();
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
    <div className="flex flex-col items-center w-full">
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
        className={`group relative flex flex-col items-center justify-center w-full min-h-[160px] p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none text-center ${
          disabled || isUploading
            ? "border-slate-200 bg-slate-50/70 text-slate-400 cursor-not-allowed opacity-80"
            : isDragging
            ? "border-blue-500 bg-blue-50/80 scale-[1.01] shadow-lg shadow-blue-500/10 text-blue-800"
            : "border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/30 text-slate-600 shadow-xs hover:shadow-md"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-900">{uploadStep}</p>
              <p className="text-[11px] text-slate-500">Please wait while we index your PDF</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                isDragging
                  ? "bg-blue-600 text-white scale-110"
                  : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105"
              }`}
            >
              <FileUp className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isDragging ? "Drop your PDF file here" : "Click to upload or drag & drop"}
              </p>
              <p className="text-[11px] text-slate-500">PDF documents only (up to 25MB, max 5 documents)</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mt-3 flex w-full items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="cursor-pointer text-rose-500 hover:text-rose-800 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
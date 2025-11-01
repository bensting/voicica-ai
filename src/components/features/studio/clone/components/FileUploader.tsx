'use client';

import { useRef, useState } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

/**
 * File Uploader Component
 *
 * Handles file selection and validation for audio/video uploads
 */
export default function FileUploader({
  onFileSelect,
  accept = 'audio/*,video/*',
  maxSize = 50, // 50MB default
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setError('');
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Area */}
      <button
        onClick={handleClick}
        className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-purple-500 hover:bg-purple-50 transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Upload Icon */}
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="text-center">
            {selectedFile ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload audio or video file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
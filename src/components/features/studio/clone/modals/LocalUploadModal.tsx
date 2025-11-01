'use client';

import { useEffect, useState, useRef } from 'react';
import FileCard from '../components/FileCard';

interface LocalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (file: File) => void;
  initialFile?: File | null;
}

/**
 * Local Upload Modal Component
 *
 * Displays file upload interface with preview and generate button
 */
export default function LocalUploadModal({
  isOpen,
  onClose,
  onGenerate,
  initialFile = null,
}: LocalUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Set initial file if provided
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset state when modal closes
      setSelectedFile(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlay = () => {
    if (!selectedFile) return;

    if (isPlaying && audioRef.current) {
      // Pause if currently playing
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play
      if (audioRef.current) {
        // Resume if audio exists
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        // Create new audio
        const url = URL.createObjectURL(selectedFile);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.play();
        setIsPlaying(true);

        // Handle audio end
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
      }
    }
  };

  const handleGenerate = () => {
    if (selectedFile) {
      onGenerate(selectedFile);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Local Upload
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File preview or upload area */}
            {selectedFile ? (
              <div className="mb-6">
                <FileCard
                  fileName={selectedFile.name}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onDelete={handleDelete}
                />
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6 hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  {/* Upload Icon */}
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload file
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Audio or video files
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedFile}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedFile
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
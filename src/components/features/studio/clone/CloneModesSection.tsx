'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import UploadModal from './modals/UploadModal';
import AudioRecorder from './modals/AudioRecorder';
import LocalUploadModal from './modals/LocalUploadModal';

/**
 * Clone Modes Section Component
 *
 * Displays two cloning modes:
 * 1. Clone Mode - Upload video or audio files
 * 2. Custom Parameter Cloning - Create unique characters
 */
export default function CloneModesSection() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLocalUploadModalOpen, setIsLocalUploadModalOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);

  const handleStartCloneMode = () => {
    setIsUploadModalOpen(true);
  };

  const handleStartCustomCloning = () => {
    console.log('Start Custom Parameter Cloning');
    // TODO: Navigate to custom cloning page or open modal
  };

  const handleLocalUpload = () => {
    console.log('Local Upload selected');
    setIsLocalUploadModalOpen(true);
  };

  const handleFileGenerate = (file: File) => {
    console.log('Generate with file:', file.name, file.size);
    // TODO: Handle file upload to backend
  };

  const handleRecordAudio = () => {
    console.log('Record Audio selected');
    setIsRecorderOpen(true);
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    console.log('Recording complete:', audioBlob.size, 'bytes');
    // Convert blob to file
    const file = new File([audioBlob], `recording_${Date.now()}.webm`, {
      type: 'audio/webm',
    });
    setRecordedFile(file);
    setIsLocalUploadModalOpen(true);
  };

  return (
    <>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Copy className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Clone Mode</h2>
        </div>
        <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full whitespace-nowrap">
          5 clone remaining
        </span>
      </div>

      {/* Clone Mode Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
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
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-2">Upload video or audio files</h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                Clone your voice by uploading a local audio sample
              </p>
            </div>
          </div>
          <button
            onClick={handleStartCloneMode}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex-shrink-0"
          >
            Start
          </button>
        </div>
      </div>

      {/* Custom Parameter Cloning Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-2">Custom Parameter Cloning</h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                Create unique characters with simple prompts
              </p>
            </div>
          </div>
          <button
            onClick={handleStartCustomCloning}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex-shrink-0"
          >
            Start
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLocalUpload={handleLocalUpload}
        onRecordAudio={handleRecordAudio}
      />

      {/* Local Upload Modal */}
      <LocalUploadModal
        isOpen={isLocalUploadModalOpen}
        onClose={() => {
          setIsLocalUploadModalOpen(false);
          setRecordedFile(null);
        }}
        onGenerate={handleFileGenerate}
        initialFile={recordedFile}
      />

      {/* Audio Recorder */}
      <AudioRecorder
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </>
  );
}
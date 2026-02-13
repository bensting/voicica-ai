'use client';

import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Mic, MicOff, Play, Pause, Trash2, FileAudio } from 'lucide-react';

interface AudioUploaderProps {
  audioBase64: string | null;
  audioFileName: string | null;
  onAudioChange: (base64: string | null, fileName: string | null) => void;
}

export default function AudioUploader({
  audioBase64,
  audioFileName,
  onAudioChange,
}: AudioUploaderProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle file upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('native.createClone.clone.maxFileSize'));
      return;
    }

    // Check file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/mp4'];
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      alert(t('native.createClone.clone.supportedFormats'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onAudioChange(base64, file.name);

      // Create preview URL
      const url = URL.createObjectURL(file);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onAudioChange, t, audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          onAudioChange(base64, 'recording.webm');

          const url = URL.createObjectURL(blob);
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(url);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            // Auto-stop at 60 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, [onAudioChange, audioUrl]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Play/pause preview
  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      audioRef.current = audio;
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  // Remove audio
  const removeAudio = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onAudioChange(null, null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingDuration(0);
  }, [audioUrl, onAudioChange]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Show audio preview if audio is loaded
  if (audioBase64 && audioFileName) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-gray-800/60 border border-gray-700/50 rounded-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600/30 text-purple-400 hover:bg-purple-600/50 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                <FileAudio className="w-4 h-4 inline mr-1.5" />
                {audioFileName}
              </div>
              <div className="text-gray-500 text-xs mt-0.5">
                {t('native.createClone.clone.supportedFormats')}
              </div>
            </div>

            <button
              onClick={removeAudio}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Recording state */}
      {isRecording ? (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <MicOff className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-white text-lg font-medium">
            {t('native.createClone.clone.recording')}
          </div>
          <div className="text-red-400 text-2xl font-mono mt-1">
            {formatDuration(recordingDuration)}
          </div>
          <button
            onClick={stopRecording}
            className="mt-4 px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {t('native.createClone.clone.stopRecording')}
          </button>
        </div>
      ) : (
        <>
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 bg-gray-800/60 border border-dashed border-gray-600/50 rounded-xl hover:border-purple-500/50 transition-colors group"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
              <div className="text-white text-sm font-medium">
                {t('native.createClone.clone.uploadAudio')}
              </div>
              <div className="text-gray-500 text-xs text-center">
                {t('native.createClone.clone.uploadDescription')}
              </div>
              <div className="text-gray-600 text-xs">
                {t('native.createClone.clone.supportedFormats')} · {t('native.createClone.clone.maxFileSize')}
              </div>
            </div>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/m4a,.mp3,.wav,.m4a"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Record button */}
          <button
            onClick={startRecording}
            className="w-full p-4 bg-gray-800/60 border border-gray-700/50 rounded-xl hover:border-purple-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                <Mic className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-white text-sm font-medium">
                  {t('native.createClone.clone.startRecording')}
                </div>
                <div className="text-gray-500 text-xs">
                  {t('native.createClone.clone.recordDescription')}
                </div>
              </div>
            </div>
          </button>
        </>
      )}
    </div>
  );
}

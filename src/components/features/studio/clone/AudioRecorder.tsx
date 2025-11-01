'use client';

import { useState, useRef, useEffect } from 'react';
import SampleTextList from './SampleTextList';

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
}

/**
 * Audio Recorder Component - Bottom Sheet
 *
 * Records audio from the user's microphone
 */
// Sample texts for different languages
const sampleTexts = {
  'en-US': [
    'In the tranquil hours of the morning, the world is bathed in a gentle light. The horizon blooms with hues of lavender and soft pink as the night retreats. There\'s a hush over the land, a sacred stillness that whispers of new beginnings and the promise of a fresh day.',
    'An artisan\'s hands move with a grace born of years. Each deliberate motion speaks of dedication, patience, and a profound respect for the craft.',
    'The city thrums with a life of its own. Streets buzz with voices, laughter, and the hum of traffic. Every corner is a story, every face a chapter.',
  ],
  'zh-CN': [
    '清晨的宁静时刻，世界沐浴在柔和的光线中。地平线上绽放出薰衣草色和柔粉色的光晕，夜色渐渐退去。大地上笼罩着一片静谧，这种神圣的宁静低语着新的开始和全新一天的承诺。',
    '工匠的双手带着多年磨练出的优雅移动。每一个精心的动作都诉说着奉献、耐心和对工艺的深深敬意。',
    '城市随着自己的生命律动而跳动。街道上充满了声音、笑声和车流的嗡鸣声。每个角落都是一个故事，每张面孔都是一个章节。',
  ],
};

export default function AudioRecorder({
  isOpen,
  onClose,
  onRecordingComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'zh-CN'>('en-US');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset state when modal closes
      stopRecording();
      setAudioURL('');
      setRecordingTime(0);
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleConfirm = () => {
    if (audioURL) {
      fetch(audioURL)
        .then((res) => res.blob())
        .then((blob) => {
          onRecordingComplete(blob);
          onClose();
        });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-xl max-w-md mx-auto max-h-[90vh] flex flex-col">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pt-4 pb-6 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Record Audio
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
          </div>

          {/* Scrollable Content Area */}
          <div className="px-6 py-6 overflow-y-auto flex-1">
            {/* Language Selection - Always visible, disabled during recording */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language Selection
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'en-US' | 'zh-CN')}
                  disabled={isRecording || !!audioURL}
                  className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isRecording || audioURL ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="zh-CN">🇨🇳 中文 (简体)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sample Texts - Only show when not recorded yet */}
            {!audioURL && <SampleTextList texts={sampleTexts[selectedLanguage]} />}
          </div>

          {/* Fixed Bottom Section */}
          <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-100 pt-6 bg-white">
            {/* Audio Player (if recording exists) */}
            {audioURL && !isRecording && (
              <div className="mb-4">
                <audio
                  src={audioURL}
                  controls
                  className="w-full"
                  style={{ height: '40px' }}
                />
              </div>
            )}

            {/* Recording visualizer */}
            <div className="flex items-center justify-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              {/* Microphone Icon / Recording Indicator */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-100 animate-pulse'
                    : 'bg-purple-100'
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    isRecording ? 'text-red-600' : 'text-purple-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>

              {/* Timer and Status */}
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900 font-mono leading-none">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isRecording ? 'Recording...' : audioURL ? 'Recording complete' : 'Ready to record'}
                </p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
              {!isRecording && !audioURL && (
                <button
                  onClick={startRecording}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Start Recording
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Stop Recording
                </button>
              )}

              {audioURL && !isRecording && (
                <>
                  <button
                    onClick={() => {
                      setAudioURL('');
                      setRecordingTime(0);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Re-record
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Confirm
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
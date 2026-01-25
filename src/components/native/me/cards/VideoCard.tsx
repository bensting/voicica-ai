'use client';

interface VideoItem {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface VideoCardProps {
  video: VideoItem;
  onClick: () => void;
}

// Video icon
const VideoIcon = () => (
  <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
  </svg>
);

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const isProcessing = video.status === 'PENDING' || video.status === 'PROCESSING';
  const isSuccess = video.status === 'SUCCESS';
  const isFailed = video.status === 'FAILURE';

  const displayTitle = video.prompt?.substring(0, 40) || 'AI Video';
  const displaySubtitle = `${video.resolution} / ${video.duration}s`;

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden">
        {isSuccess && video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            {isProcessing && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[9px] font-medium">{video.progress}%</span>
              </div>
            )}
            {isFailed && (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {!isProcessing && !isFailed && <VideoIcon />}
          </div>
        )}
        {/* Status tag */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-blue-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{displayTitle}</h4>
        <p className="text-gray-500 text-sm truncate">{displaySubtitle}</p>
      </div>
    </button>
  );
}

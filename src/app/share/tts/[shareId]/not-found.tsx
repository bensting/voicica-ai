import Link from 'next/link';

/**
 * 分享内容不存在页面
 */
export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-gray-400"
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

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Content Not Found
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          The shared audio you&apos;re looking for doesn&apos;t exist or is no longer available.
        </p>

        {/* CTA */}
        <Link
          href="/studio/tts"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          Create Your Own Voice
        </Link>

        {/* Home Link */}
        <div className="mt-6">
          <Link href="/" className="text-sm text-purple-600 hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
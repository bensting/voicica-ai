'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Volume2, Image, MoreVertical, Trash2, Clock, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getUserStories } from '@/actions/story';
import type { UserStory } from '@/actions/story';
import LoginModal from '@/components/features/auth/LoginModal';

/**
 * Story Card Component
 */
function StoryCard({
  story,
  onGenerateAudio,
  onGenerateIllustration,
  t,
}: {
  story: UserStory;
  onGenerateAudio: (story: UserStory) => void;
  onGenerateIllustration: (story: UserStory) => void;
  t: (key: string) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1">
            {story.title}
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // TODO: Implement delete
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body - Content Preview */}
      <div className="p-4">
        <p className="text-gray-600 text-sm line-clamp-3">
          {truncateContent(story.content, 150)}
        </p>
      </div>

      {/* Card Meta */}
      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(story.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {story.wordCount} {t('story.characters') || 'chars'}
        </span>
        {story.illustrationCount > 0 && (
          <span className="flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            {story.illustrationCount}
          </span>
        )}
      </div>

      {/* Card Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onGenerateAudio(story)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <Volume2 className="w-4 h-4" />
          {t('story.generateAudio') || 'Audio'}
        </button>
        <button
          onClick={() => onGenerateIllustration(story)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <Image className="w-4 h-4" />
          {t('story.generateIllustration') || 'Illustration'}
        </button>
      </div>
    </div>
  );
}

/**
 * My Stories Page
 *
 * 显示用户生成的故事列表
 */
export default function MyStoriesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { user } = useFirebaseAuth();

  // State
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 设置页面标题
  useEffect(() => {
    setTitle(t('story.myStoriesTitle') || 'My Stories');
  }, [t, setTitle]);

  // 获取故事列表
  useEffect(() => {
    const fetchStories = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getUserStories();

        if (!result.success) {
          if (result.errorCode === 'LOGIN_REQUIRED') {
            setIsLoginModalOpen(true);
          } else {
            setError(result.error || 'Failed to fetch stories');
          }
          return;
        }

        setStories(result.stories || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, [user]);

  // Action handlers
  const handleGenerateAudio = (story: UserStory) => {
    // Save story content to localStorage for TTS page to pick up
    localStorage.setItem('lastTTSInputText', story.content);
    // Navigate to TTS page
    router.push('/studio/tts');
  };

  const handleGenerateIllustration = (story: UserStory) => {
    // TODO: Navigate to illustration generation
    console.log('Generate illustration for:', story.title);
  };

  // Empty state component
  const EmptyState = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="text-center">
      <div className={`${mobile ? 'w-20 h-20' : 'w-24 h-24'} mx-auto mb-4 lg:mb-6 bg-purple-100 rounded-full flex items-center justify-center`}>
        <BookOpen className={`${mobile ? 'w-10 h-10' : 'w-12 h-12'} text-purple-500`} />
      </div>
      <h2 className={`${mobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-800 mb-2`}>
        {t('story.noStories') || 'No stories yet'}
      </h2>
      <p className={`text-gray-500 ${mobile ? 'text-sm' : ''}`}>
        {t('story.noStoriesDesc') || 'Your generated stories will appear here'}
      </p>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  // Stories grid component
  const StoriesGrid = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`grid gap-4 ${mobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          onGenerateAudio={handleGenerateAudio}
          onGenerateIllustration={handleGenerateIllustration}
          t={t}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white" style={{ top: 'calc(60px + var(--safe-area-inset-top, 0px))', bottom: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }}>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            {isLoading ? (
              <LoadingState />
            ) : stories.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState mobile />
              </div>
            ) : (
              <StoriesGrid mobile />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('story.myStoriesTitle') || 'My Stories'}
            </h1>
            <p className="text-gray-500">
              {t('story.myStoriesSubtitle') || 'View and manage your generated stories'}
            </p>
          </div>

          {/* Stories List / Empty State */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <LoadingState />
            ) : stories.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <EmptyState />
              </div>
            ) : (
              <StoriesGrid />
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getUserStories, deleteStory } from '@/actions/story';
import type { UserStory } from '@/actions/story';
import LoginModal from '@/components/features/auth/LoginModal';
import {
  StoryCard,
  DeleteConfirmModal,
  ParagraphMediaModal,
} from '@/components/features/story';

/**
 * My Stories Page
 *
 * 显示用户生成的故事列表
 */
export default function MyStoriesPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { user } = useFirebaseAuth();

  // State
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mediaStory, setMediaStory] = useState<UserStory | null>(null);
  const [deleteConfirmStory, setDeleteConfirmStory] = useState<UserStory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      try {
        const result = await getUserStories();

        if (!result.success) {
          if (result.errorCode === 'LOGIN_REQUIRED') {
            setIsLoginModalOpen(true);
          } else {
            console.error('Failed to fetch stories:', result.error);
          }
          return;
        }

        setStories(result.stories || []);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, [user]);

  // Action handlers
  const handleOpenMedia = (story: UserStory) => {
    setMediaStory(story);
  };

  const handleMediaSuccess = async () => {
    // 刷新故事数据
    try {
      const result = await getUserStories();
      if (result.success) {
        setStories(result.stories || []);
      }
    } catch (err) {
      console.error('Failed to refresh stories:', err);
    }
  };

  const handleEdit = (story: UserStory) => {
    console.log('Edit story:', story.title);
  };

  const handleDelete = (story: UserStory) => {
    setDeleteConfirmStory(story);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmStory) return;

    setIsDeleting(true);
    try {
      const result = await deleteStory(deleteConfirmStory.id);

      if (result.success) {
        setStories((prev) => prev.filter((s) => s.id !== deleteConfirmStory.id));
        setDeleteConfirmStory(null);
      } else {
        console.error('Failed to delete story:', result.error);
      }
    } catch (err) {
      console.error('Error deleting story:', err);
    } finally {
      setIsDeleting(false);
    }
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
          onOpenMedia={handleOpenMedia}
          onEdit={handleEdit}
          onDelete={handleDelete}
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

      {/* Paragraph Media Modal (Audio & Illustrations) */}
      <ParagraphMediaModal
        story={mediaStory}
        isOpen={!!mediaStory}
        onClose={() => setMediaStory(null)}
        onSuccess={handleMediaSuccess}
        t={t}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        story={deleteConfirmStory}
        isOpen={!!deleteConfirmStory}
        onClose={() => setDeleteConfirmStory(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        t={t}
      />
    </>
  );
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { uploadAvatar } from '@/actions/user';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfilePictureUploadProps {
  currentPhoto?: string | null;
  onPhotoChange: (url: string) => void;
  onUploadSuccess?: () => void;
}

export default function ProfilePictureUpload({ currentPhoto, onPhotoChange, onUploadSuccess }: ProfilePictureUploadProps) {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // 先显示本地预览
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    setIsUploading(true);

    try {
      // 上传到服务器
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadAvatar(formData);

      if (result.success && result.url) {
        onPhotoChange(result.url);
        setPreviewUrl(null); // 清除本地预览，使用服务器 URL
        // 触发上传成功回调，刷新用户数据
        onUploadSuccess?.();
      } else {
        alert(result.message || 'Failed to upload image');
        setPreviewUrl(null); // 上传失败，恢复原头像
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  // 显示的图片：优先本地预览 > 当前头像
  const displayPhoto = previewUrl || currentPhoto;

  return (
    <div className="flex items-center gap-4">
      {/* Profile Picture */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
          {displayPhoto ? (
            <Image
              src={displayPhoto}
              alt="Profile"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized={previewUrl !== null}
            />
          ) : (
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        
        {/* Camera Icon Overlay */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* Label and Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('settings.basicInfo.profilePicture')}
        </label>
        <p className="text-sm text-gray-500">
          {t('settings.basicInfo.profilePictureHint')}
        </p>
        {isUploading && (
          <p className="text-sm text-blue-600 mt-1">{t('settings.basicInfo.uploading')}</p>
        )}
      </div>
    </div>
  );
}

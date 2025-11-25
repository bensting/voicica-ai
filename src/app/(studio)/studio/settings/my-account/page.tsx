'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateUserProfile } from '@/actions/user';
import ProfilePictureUpload from '@/components/features/settings/my-account/ProfilePictureUpload';
import FormField from '@/components/features/settings/my-account/FormField';
import PhoneField from '@/components/features/settings/my-account/PhoneField';
import ActionButtons from '@/components/features/settings/my-account/ActionButtons';
import CreditsIcon from '@/components/icons/CreditsIcon';

export default function MyAccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { profile, loading, refreshProfile, refreshProfileSilent } = useUser();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+66',
    photo_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 检查登录状态，未登录则重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = window.location.pathname;
      router.push(`/studio/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [user, authLoading, router]);

  // 解析电话号码为国家代码和号码
  const parsePhone = (phone: string | null) => {
    if (!phone) return { countryCode: '+86', phoneNumber: '' };
    // 尝试匹配国家代码
    const match = phone.match(/^(\+\d{1,4})(.*)$/);
    if (match) {
      return { countryCode: match[1], phoneNumber: match[2] };
    }
    return { countryCode: '+86', phoneNumber: phone };
  };

  // 当 profile 加载完成后，更新表单数据
  useEffect(() => {
    if (profile) {
      const { countryCode, phoneNumber } = parsePhone(profile.phone || null);
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: phoneNumber,
        countryCode: countryCode,
        photo_url: profile.photo_url || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 组合完整电话号码
      const fullPhone = formData.phone
        ? `${formData.countryCode}${formData.phone.replace(/^0+/, '')}`
        : undefined;

      // 始终传递 name，即使是空字符串也要更新
      await updateUserProfile({
        name: formData.name,
        phone: fullPhone,
      });

      // 刷新用户资料
      await refreshProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (profile) {
      const { countryCode, phoneNumber } = parsePhone(profile.phone || null);
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: phoneNumber,
        countryCode: countryCode,
        photo_url: profile.photo_url || ''
      });
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshProfileSilent();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 认证加载中或数据加载中，显示加载状态
  if (authLoading || loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg p-6">
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 未登录，不渲染内容（等待重定向）
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('settings.basicInfo.title')}
          </h2>
        </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Profile Picture with User Info and Credits */}
        <div className="flex items-start justify-between gap-6">
          {/* Left: Profile Picture and User Info */}
          <ProfilePictureUpload
            currentPhoto={profile?.photo_url}
            userName={profile?.name}
            email={profile?.email}
            onPhotoChange={(url) => handleInputChange('photo_url', url)}
            onUploadSuccess={refreshProfile}
          />

          {/* Right: Credits Display */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-gradient-to-br from-yellow-50 to-yellow-100 px-4 py-3 rounded-xl border border-yellow-200">
                <CreditsIcon className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    {t('settings.benefits.credits')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(profile?.credits ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/studio/settings/credit-history"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                >
                  {t('settings.benefits.viewHistory')}
                </Link>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                  title={t('settings.benefits.refresh')}
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Name & Surname */}
        <FormField
          label={t('settings.basicInfo.nameSurname')}
          value={formData.name}
          onChange={(value) => handleInputChange('name', value)}
          placeholder="Enter your name"
        />

        {/* Phone */}
        <PhoneField
          label={t('settings.basicInfo.phone')}
          countryCode={formData.countryCode}
          phoneNumber={formData.phone}
          onCountryCodeChange={(code) => handleInputChange('countryCode', code)}
          onPhoneChange={(phone) => handleInputChange('phone', phone)}
        />
      </div>

        {/* Action Buttons */}
        <ActionButtons
          onSave={handleSave}
          onCancel={handleCancel}
          saveText={t('settings.actions.save')}
          cancelText={t('settings.actions.cancel')}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfilePictureUpload from '@/components/features/settings/my-account/ProfilePictureUpload';
import FormField from '@/components/features/settings/my-account/FormField';
import PhoneField from '@/components/features/settings/my-account/PhoneField';
import ActionButtons from '@/components/features/settings/my-account/ActionButtons';

export default function MyAccountPage() {
  const { profile, loading } = useUser();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: '',
    countryCode: '+66'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', formData);
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: '',
      countryCode: '+66'
    });
  };

  if (loading) {
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

  return (
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
        {/* Profile Picture */}
        <ProfilePictureUpload
          currentPhoto={profile?.photo_url}
          onPhotoChange={(url) => handleInputChange('photo_url', url)}
        />

        {/* Name & Surname */}
        <FormField
          label={t('settings.basicInfo.nameSurname')}
          value={formData.name}
          onChange={(value) => handleInputChange('name', value)}
          placeholder="Enter your name"
        />

        {/* Email Address */}
        <FormField
          label={t('settings.basicInfo.email')}
          value={formData.email}
          onChange={(value) => handleInputChange('email', value)}
          placeholder="Enter your email"
          type="email"
          disabled
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
        saveText={t('settings.actions.saveChanges')}
        cancelText={t('settings.actions.cancel')}
      />
    </div>
  );
}
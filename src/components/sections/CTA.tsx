'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DollarSign, Headphones, Shield, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';

interface CTAFeature {
  icon: React.ReactNode;
  labelKey: string;
}

interface CTAButton {
  labelKey: string;
  href: string;
  variant: 'primary' | 'secondary';
  openInNewWindow?: boolean;
}

interface CTAProps {
  brandName?: string;
  titleKey: string;
  buttons?: CTAButton[];
  features?: CTAFeature[];
}

/**
 * CTA (Call to Action) Section Component
 *
 * A prominent call-to-action section with brand name, title, action buttons,
 * and feature highlights. Designed to convert visitors into users.
 */
export default function CTA({
  titleKey,
  buttons,
  features,
}: CTAProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Default buttons
  const defaultButtons: CTAButton[] = [
    {
      labelKey: 'cta.getStarted',
      href: '/studio/tts',
      variant: 'primary',
    },
    {
      labelKey: 'cta.viewPricing',
      href: '/pricing',
      variant: 'secondary',
    },
  ];

  // Default features
  const defaultFeatures: CTAFeature[] = [
    {
      icon: <DollarSign className="w-5 h-5" />,
      labelKey: 'cta.features.moneyBack',
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      labelKey: 'cta.features.support',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      labelKey: 'cta.features.secure',
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      labelKey: 'cta.features.updates',
    },
  ];

  const ctaButtons = buttons || defaultButtons;
  const ctaFeatures = features || defaultFeatures;

  const handleButtonClick = (button: CTAButton) => {
    if (button.openInNewWindow) {
      window.open(button.href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(button.href);
    }
  };

  return (
    <section className="relative py-12 sm:py-16 px-4 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Brand Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/logo/voice-labs-logo-light.svg"
            alt="AI-Voice-Labs.com"
            width={250}
            height={40}
            priority
            className="h-10 md:h-12 lg:h-14 w-auto"
          />
        </div>

        {/* Main Title */}
        <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-white mb-10 leading-tight max-w-4xl mx-auto">
          {t(titleKey)}
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          {ctaButtons.map((button, index) =>
            button.variant === 'primary' ? (
              <GradientButton
                key={index}
                size="lg"
                className="min-w-[240px]"
                onClick={() => handleButtonClick(button)}
              >
                {t(button.labelKey)}
              </GradientButton>
            ) : (
              <button
                key={index}
                onClick={() => handleButtonClick(button)}
                className="group relative px-10 py-4 rounded-xl font-bold text-lg
                  transition-all duration-300 hover:scale-105
                  min-w-[240px] flex items-center justify-center gap-2
                  bg-transparent border-2 border-pink-400 text-pink-200 hover:bg-pink-500/10"
              >
                <span>{t(button.labelKey)}</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </button>
            )
          )}
        </div>

        {/* Features Grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ctaFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  {feature.icon}
                </div>
                <span className="text-sm md:text-base font-medium text-left">
                  {t(feature.labelKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
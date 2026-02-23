'use client';

import { useState } from 'react';
import AppDownloadModal from '@/components/common/AppDownloadModal';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app';

function GooglePlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z" />
      <path fill="#FBBC04" d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z" />
      <path fill="#34A853" d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z" />
      <path fill="#4285F4" d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z" />
    </svg>
  );
}

function AndroidIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#3DDC84">
      <path d="M17.523 15.341c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .906-.407.906-.906s-.406-.905-.906-.905zm-11.046 0c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .908-.407.908-.906s-.408-.905-.908-.905zm11.4-6.029l1.96-3.395a.407.407 0 00-.704-.407l-1.984 3.438c-1.47-.67-3.12-1.043-4.896-1.043s-3.426.373-4.896 1.043L5.373 5.51a.407.407 0 00-.704.407l1.96 3.395C3.571 11.018 1.6 14.018 1.6 17.497h20.8c0-3.479-1.971-6.479-5.023-8.185z" />
    </svg>
  );
}

interface SeoCtaProps {
  /** CTA 按钮文字 */
  buttonText: string;
}

/**
 * SEO 页面通用 CTA 区域（客户端组件）
 * 包含主按钮（打开下载弹窗）+ APK / Google Play 下载入口
 */
export default function SeoCta({ buttonText }: SeoCtaProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* 主 CTA 按钮 */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {buttonText}
      </button>

      {/* 下载入口 */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {/* APK 直接下载 (Pro) */}
        <button
          onClick={() => setShowModal(true)}
          className="group inline-flex items-center gap-2.5 rounded-xl border border-[#3DDC84]/20 bg-[#3DDC84]/5 px-5 py-2.5 transition-colors hover:border-[#3DDC84]/40 hover:bg-[#3DDC84]/10"
        >
          <AndroidIcon className="h-6 w-6" />
          <div className="text-left">
            <div className="text-[10px] font-medium uppercase leading-tight text-[#3DDC84]/70">
              Download APK
            </div>
            <div className="text-sm font-semibold leading-tight text-white">
              Pro Version
            </div>
          </div>
        </button>

        {/* Google Play (Standard) */}
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 transition-colors hover:bg-white/10"
        >
          <GooglePlayIcon className="h-6 w-6" />
          <div className="text-left">
            <div className="text-[10px] uppercase leading-tight text-gray-400">
              Get it on
            </div>
            <div className="text-sm font-semibold leading-tight text-white">
              Google Play
            </div>
          </div>
        </a>
      </div>

      <AppDownloadModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

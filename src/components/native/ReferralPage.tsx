'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMyReferralInfo, getReferralTeam } from '@/actions/referral';
import type { ReferralInfo, ReferralTeamMember } from '@/actions/referral';
import { Share } from '@capacitor/share';
import LoginModal from './LoginModal';

/**
 * Referral Team 页面
 */
export default function ReferralPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const { t } = useLanguage();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [team, setTeam] = useState<ReferralTeamMember[]>([]);
  const [teamTotal, setTeamTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [infoData, teamData] = await Promise.all([
        getMyReferralInfo(),
        getReferralTeam(1, 20),
      ]);
      setInfo(infoData);
      setTeam(teamData.items);
      setTeamTotal(teamData.total);
      setHasMore(teamData.hasMore);
      setPage(1);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const teamData = await getReferralTeam(nextPage, 20);
      setTeam(prev => [...prev, ...teamData.items]);
      setHasMore(teamData.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCopy = async () => {
    if (!info?.referralCode) return;
    try {
      await navigator.clipboard.writeText(info.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = info.referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!info?.referralCode) return;
    const shareUrl = `https://voicica.ai/native?ref=${info.referralCode}`;
    const shareText = t('native.referral.inviteText').replace('{{code}}', info.referralCode).replace('{{url}}', shareUrl);
    try {
      await Share.share({
        title: 'VoicicaAI',
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // Share cancelled or not available, try clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  };

  const getLevelLabel = (level: string) => {
    const map: Record<string, string> = {
      miner: t('native.referral.levelMiner'),
      bronze: t('native.referral.levelBronze'),
      gold: t('native.referral.levelGold'),
    };
    return map[level] || level;
  };

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = {
      miner: 'text-slate-400',
      bronze: 'text-amber-600',
      gold: 'text-yellow-400',
    };
    return map[level] || 'text-slate-400';
  };

  const getLevelBg = (level: string) => {
    const map: Record<string, string> = {
      miner: 'bg-slate-700/50',
      bronze: 'bg-amber-900/30 border border-amber-700/30',
      gold: 'bg-yellow-900/30 border border-yellow-600/30',
    };
    return map[level] || 'bg-slate-700/50';
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="7" r="3" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            <path d="M17 14a3 3 0 013 3v2" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">{t('native.referral.title')}</h2>
        <p className="text-slate-400 text-sm text-center mb-6">{t('native.referral.loginRequired')}</p>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium"
        >
          {t('native.login.loginWithGoogle')}
        </button>
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="pb-24 px-4 pt-2">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-white mb-4">{t('native.referral.title')}</h1>

      {/* Invite Code Card */}
      <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-5 mb-4 border border-purple-500/20">
        <p className="text-slate-400 text-xs mb-2">{t('native.referral.myCode')}</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold text-white tracking-[0.3em] font-mono">{info.referralCode}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {copied ? t('native.referral.copied') : t('native.referral.copyCode')}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            {t('native.referral.share')}
          </button>
        </div>
      </div>

      {/* My Level */}
      <div className={`rounded-2xl p-4 mb-4 ${getLevelBg(info.referralLevel)}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">{t('native.referral.myLevel')}</span>
          <span className={`text-lg font-bold ${getLevelColor(info.referralLevel)}`}>
            {getLevelLabel(info.referralLevel)}
          </span>
        </div>

        {/* Upgrade Progress */}
        {info.referralLevel === 'miner' && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t('native.referral.upgradeProgress')}</span>
              <span>{info.upgradeProgress.bronze.current}/{info.upgradeProgress.bronze.required} {t('native.referral.directReferrals')}</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (info.upgradeProgress.bronze.current / info.upgradeProgress.bronze.required) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {info.referralLevel === 'bronze' && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t('native.referral.upgradeProgress')}</span>
              <span>{info.upgradeProgress.gold.current}/{info.upgradeProgress.gold.required} {t('native.referral.bronzeCaptains')}</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (info.upgradeProgress.gold.current / info.upgradeProgress.gold.required) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t('native.referral.totalEarnings')}</p>
          <p className="text-xl font-bold text-white">{info.totalEarnings.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">$VOICICA</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t('native.referral.todayEarnings')}</p>
          <p className="text-xl font-bold text-white">{info.todayEarnings.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">$VOICICA</p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t('native.referral.directReferrals')}</p>
          <p className="text-xl font-bold text-white">{info.directReferrals}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t('native.referral.teamMembers')}</p>
          <p className="text-xl font-bold text-white">{info.teamMembers}</p>
        </div>
      </div>

      {/* Rules Card */}
      <div className="bg-slate-800/40 rounded-2xl p-4 mb-4 border border-slate-700/30">
        <h3 className="text-white text-sm font-semibold mb-3">{t('native.referral.rules.title')}</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-slate-500 shrink-0">L1</span>
            <span className="text-slate-300">{t('native.referral.rules.l1')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-500 shrink-0">L2</span>
            <span className="text-slate-300">{t('native.referral.rules.l2')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 shrink-0">Team</span>
            <span className="text-slate-300">{t('native.referral.rules.team')}</span>
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="mb-4">
        <h3 className="text-white text-sm font-semibold mb-3">{t('native.referral.team.title')} ({teamTotal})</h3>
        {team.length === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-8 text-center">
            <p className="text-slate-500 text-sm">{t('native.referral.team.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {team.map((member, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white">{member.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${getLevelColor(member.level)}`}>
                    {getLevelLabel(member.level)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    +{member.totalContribution} $V
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            {loadingMore ? t('native.common.loading') : t('native.referral.team.loadMore')}
          </button>
        )}
      </div>
    </div>
  );
}

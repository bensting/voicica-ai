'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMyReferralInfo, getReferralTeam, processReferralCode } from '@/actions/referral';
import type { ReferralInfo, ReferralTeamMember } from '@/actions/referral';
import { Share } from '@capacitor/share';
import { getMiningEconomyConfig } from '@/config/appConfig';
import LoginModal from './LoginModal';
import { formatCredits } from '@/utils/formatCredits';

/**
 * Referral Team 页面
 */
export default function ReferralPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const { t } = useLanguage();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [team, setTeam] = useState<ReferralTeamMember[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [inviterCode, setInviterCode] = useState('');
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState('');

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicica.ai';
    const shareUrl = `${baseUrl}/mining?ref=${info.referralCode}`;
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

  const handleBind = async () => {
    const code = inviterCode.trim().toUpperCase();
    if (!code) return;
    setBindError('');
    setBinding(true);
    try {
      const result = await processReferralCode(code);
      if (result.success) {
        // Reload data to reflect the binding
        await loadData();
        setInviterCode('');
      } else {
        setBindError(result.message || t('native.referral.bind.failed'));
      }
    } catch {
      setBindError(t('native.referral.bind.failed'));
    } finally {
      setBinding(false);
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

  const getLevelIcon = (level: string) => {
    const map: Record<string, string> = {
      miner: '⛏',
      bronze: '🛡',
      gold: '👑',
    };
    return map[level] || '⛏';
  };

  const getLevelBorderStyle = (level: string): React.CSSProperties => {
    const gradients: Record<string, string> = {
      miner: 'linear-gradient(135deg, #475569, #64748b, #475569)',
      bronze: 'linear-gradient(135deg, #b45309, #f59e0b, #b45309)',
      gold: 'linear-gradient(135deg, #ca8a04, #fbbf24, #eab308, #fbbf24, #ca8a04)',
    };
    return {
      background: gradients[level] || gradients.miner,
      padding: '1.5px',
      borderRadius: '1rem',
    };
  };

  const getLevelCardBg = (level: string) => {
    const map: Record<string, string> = {
      miner: 'bg-slate-900/95',
      bronze: 'bg-gradient-to-br from-slate-900/95 via-amber-950/20 to-slate-900/95',
      gold: 'bg-gradient-to-br from-slate-900/95 via-yellow-950/30 to-slate-900/95',
    };
    return map[level] || map.miner;
  };

  const getActivePillStyle = (level: string) => {
    const map: Record<string, string> = {
      miner: 'text-purple-300 bg-purple-500/20 border border-purple-500/30',
      bronze: 'text-amber-300 bg-amber-500/20 border border-amber-500/30',
      gold: 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30',
    };
    return map[level] || map.miner;
  };

  const isCommissionActive = (level: string, tier: 'l1' | 'l2' | 'team') => {
    if (tier === 'l1') return true; // L1 always active
    if (tier === 'l2') return level === 'bronze' || level === 'gold';
    if (tier === 'team') return level === 'gold';
    return false;
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

  // Skeleton placeholder
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
  );

  if (!loading && !info) return null;

  return (
    <div className="pb-24 px-4 pt-2">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-white mb-4">{t('native.referral.title')}</h1>

      {/* Invite Code Card */}
      <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-5 mb-4 border border-purple-500/20">
        <p className="text-slate-400 text-xs mb-2">{t('native.referral.myCode')}</p>
        <div className="flex items-center gap-3 mb-4">
          {loading
            ? <Skeleton className="h-9 w-48" />
            : <span className="text-3xl font-bold text-white tracking-[0.3em] font-mono">{info!.referralCode}</span>
          }
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
          >
            {copied ? t('native.referral.copied') : t('native.referral.copyCode')}
          </button>
          <button
            onClick={handleShare}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
          >
            {t('native.referral.share')}
          </button>
        </div>
      </div>

      {/* My Level */}
      {loading ? (
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2.5 mb-4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ) : (
        <div style={getLevelBorderStyle(info!.referralLevel)} className="mb-4">
          <div className={`rounded-2xl p-4 ${getLevelCardBg(info!.referralLevel)}`}>
            {/* Level Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-2xl">{getLevelIcon(info!.referralLevel)}</span>
              <span className={`text-lg font-bold ${getLevelColor(info!.referralLevel)}`}>
                {getLevelLabel(info!.referralLevel)}
              </span>
            </div>

            {/* Commission Rates */}
            <div className="flex items-center gap-2 mb-4">
              {([
                { key: 'l1' as const, label: t('native.referral.level.l1'), rate: '8%' },
                { key: 'l2' as const, label: t('native.referral.level.l2'), rate: '3%' },
                { key: 'team' as const, label: 'Pool', rate: '2%' },
              ]).map((item, idx) => {
                const active = isCommissionActive(info!.referralLevel, item.key);
                return (
                  <div key={item.key} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-slate-600">·</span>}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      active ? getActivePillStyle(info!.referralLevel) : 'text-slate-600 bg-slate-800/50 line-through'
                    }`}>
                      {item.label} {item.rate}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Upgrade Progress */}
            {info!.referralLevel === 'miner' && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                  <span>▸</span>
                  <span>{t('native.referral.level.nextLevel')}: {t('native.referral.levelBronze')}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (info!.upgradeProgress.bronze.current / info!.upgradeProgress.bronze.required) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{info!.upgradeProgress.bronze.current}/{info!.upgradeProgress.bronze.required} {t('native.referral.directReferrals')}</span>
                </div>
              </div>
            )}
            {info!.referralLevel === 'bronze' && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                  <span>▸</span>
                  <span>{t('native.referral.level.nextLevel')}: {t('native.referral.levelGold')}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (info!.upgradeProgress.gold.current / info!.upgradeProgress.gold.required) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{info!.upgradeProgress.gold.current}/{info!.upgradeProgress.gold.required} {t('native.referral.bronzeCaptains')}</span>
                </div>
              </div>
            )}
            {info!.referralLevel === 'gold' && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400/70">
                <span>★</span>
                <span>{t('native.referral.level.maxLevel')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earnings Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t('native.referral.totalEarnings')}</p>
          {loading
            ? <Skeleton className="h-7 w-20 mt-1" />
            : <>
                <p className="text-xl font-bold text-white">{formatCredits(info!.totalEarnings)}</p>
                <p className="text-[10px] text-slate-500">$VOICICA</p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  ≈ {(info!.totalEarnings * getMiningEconomyConfig().token_value_usd).toFixed(4)} USDT
                </p>
              </>
          }
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t('native.referral.todayEarnings')}</p>
          {loading
            ? <Skeleton className="h-7 w-20 mt-1" />
            : <>
                <p className="text-xl font-bold text-white">{formatCredits(info!.todayEarnings)}</p>
                <p className="text-[10px] text-slate-500">$VOICICA</p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  ≈ {(info!.todayEarnings * getMiningEconomyConfig().token_value_usd).toFixed(4)} USDT
                </p>
              </>
          }
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
            <span className="text-purple-400 shrink-0">Pool</span>
            <span className="text-slate-300">{t('native.referral.rules.team')}</span>
          </div>
        </div>
      </div>

      {/* Bind Inviter — only show when user has no inviter */}
      {info && !info.referredBy && (
        <div className="bg-slate-800/40 rounded-2xl p-4 mb-4 border border-slate-700/30">
          <p className="text-slate-300 text-xs mb-3">{t('native.referral.bind.hint')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviterCode}
              onChange={(e) => { setInviterCode(e.target.value.toUpperCase()); setBindError(''); }}
              placeholder={t('native.referral.bind.placeholder')}
              maxLength={10}
              className="flex-1 bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 font-mono tracking-wider"
            />
            <button
              onClick={handleBind}
              disabled={binding || !inviterCode.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 shrink-0"
            >
              {binding ? '...' : t('native.referral.bind.button')}
            </button>
          </div>
          {bindError && (
            <p className="text-red-400 text-xs mt-2">{bindError}</p>
          )}
        </div>
      )}

      {/* Team List */}
      <div className="mb-4">
        {/* Header: title + inviter badge */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-sm font-semibold">
            {t('native.referral.team.title')} {loading ? '' : `(${info?.teamMembers ?? 0})`}
          </h3>
          {info?.inviterCode && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-600/60 bg-slate-800/60 text-xs">
              <span className="text-green-400 font-mono">{t('native.referral.bind.inviter')}: {info.inviterCode}</span>
            </span>
          )}
        </div>

        {loading ? (
          /* Team skeleton */
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-3 flex items-center">
                <div className="flex items-center gap-2.5 min-w-0 w-2/5">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
                <div className="w-1/5 flex justify-center">
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="w-2/5 flex flex-col items-end">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* L1/L2/L3+ Breakdown */}
            {info && info.teamMembers > 0 && (() => {
              const { l1, l2, l3Plus } = info.teamBreakdown;
              const total = l1 + l2 + l3Plus;
              const pctL1 = total > 0 ? (l1 / total) * 100 : 0;
              const pctL2 = total > 0 ? (l2 / total) * 100 : 0;
              const pctL3 = total > 0 ? (l3Plus / total) * 100 : 0;
              return (
                <div className="bg-slate-800/50 rounded-xl p-4 mb-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{l1}</p>
                      <p className="text-[10px] text-slate-400 mb-1.5">{t('native.referral.team.l1')}</p>
                      <p className="text-[11px] font-medium text-purple-400">{pctL1.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{l2}</p>
                      <p className="text-[10px] text-slate-400 mb-1.5">{t('native.referral.team.l2')}</p>
                      <p className="text-[11px] font-medium text-blue-400">{pctL2.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{l3Plus}</p>
                      <p className="text-[10px] text-slate-400 mb-1.5">{t('native.referral.team.l3Plus')}</p>
                      <p className="text-[11px] font-medium text-cyan-400">{pctL3.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Member list */}
            {team.length === 0 ? (
              <div className="bg-slate-800/40 rounded-xl p-8 text-center">
                <p className="text-slate-500 text-sm">{t('native.referral.team.empty')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {team.map((member, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl p-3 flex items-center">
                    {/* Left: avatar + name + date */}
                    <div className="flex items-center gap-2.5 min-w-0 w-2/5">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-slate-500">{new Date(member.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* Center: sub-team count */}
                    <div className="w-1/5 text-center">
                      <p className="text-sm font-bold text-white">{member.subTeamCount}</p>
                      <p className="text-[10px] text-slate-400">{t('native.referral.teamMembers')}</p>
                    </div>
                    {/* Right: level + contribution */}
                    <div className="w-2/5 text-right">
                      <p className={`text-xs font-medium ${getLevelColor(member.level)}`}>
                        {getLevelLabel(member.level)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        +{formatCredits(member.totalContribution)} $V
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
          </>
        )}
      </div>
    </div>
  );
}

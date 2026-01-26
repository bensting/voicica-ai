/**
 * Native Analytics Utility
 *
 * 使用 Firebase Analytics 追踪 App 使用情况
 * - 自动追踪：页面浏览、会话、用户属性
 * - 手动追踪：自定义事件、用户行为
 */
import { Capacitor } from '@capacitor/core';

// 延迟加载 Firebase Analytics
let analyticsInstance: typeof import('@capacitor-firebase/analytics').FirebaseAnalytics | null = null;

async function getAnalytics() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  if (!analyticsInstance) {
    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    analyticsInstance = FirebaseAnalytics;
  }

  return analyticsInstance;
}

/**
 * 设置用户 ID（登录后调用）
 */
export async function setUserId(userId: string | null): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;

    if (userId) {
      await analytics.setUserId({ userId });
      console.log('📊 [Analytics] User ID set:', userId);
    } else {
      await analytics.setUserId({ userId: null });
      console.log('📊 [Analytics] User ID cleared');
    }
  } catch (error) {
    console.error('❌ [Analytics] Failed to set user ID:', error);
  }
}

/**
 * 设置用户属性
 */
export async function setUserProperty(key: string, value: string): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;

    await analytics.setUserProperty({ key, value });
    console.log('📊 [Analytics] User property set:', key, value);
  } catch (error) {
    console.error('❌ [Analytics] Failed to set user property:', error);
  }
}

/**
 * 记录页面浏览
 */
export async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;

    await analytics.logEvent({
      name: 'screen_view',
      params: {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      },
    });
    console.log('📊 [Analytics] Screen view:', screenName);
  } catch (error) {
    console.error('❌ [Analytics] Failed to log screen view:', error);
  }
}

/**
 * 记录自定义事件
 */
export async function logEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;

    await analytics.logEvent({
      name: eventName,
      params: params || {},
    });
    console.log('📊 [Analytics] Event:', eventName, params);
  } catch (error) {
    console.error('❌ [Analytics] Failed to log event:', error);
  }
}

// ============ 预定义的业务事件 ============

/**
 * 用户登录
 */
export async function logLogin(method: string): Promise<void> {
  await logEvent('login', { method });
}

/**
 * 用户注册
 */
export async function logSignUp(method: string): Promise<void> {
  await logEvent('sign_up', { method });
}

/**
 * TTS 生成
 */
export async function logTtsGenerate(params: {
  voiceName: string;
  language: string;
  characterCount: number;
}): Promise<void> {
  await logEvent('tts_generate', {
    voice_name: params.voiceName,
    language: params.language,
    character_count: params.characterCount,
  });
}

/**
 * 视频生成
 */
export async function logVideoGenerate(params: {
  model: string;
  aspectRatio: string;
  duration: number;
}): Promise<void> {
  await logEvent('video_generate', {
    model: params.model,
    aspect_ratio: params.aspectRatio,
    duration: params.duration,
  });
}

/**
 * AI Cover 生成
 */
export async function logCoverGenerate(params: {
  voiceModelName: string;
}): Promise<void> {
  await logEvent('cover_generate', {
    voice_model_name: params.voiceModelName,
  });
}

/**
 * 对话生成
 */
export async function logDialogueGenerate(params: {
  voiceCount: number;
  totalCharacters: number;
}): Promise<void> {
  await logEvent('dialogue_generate', {
    voice_count: params.voiceCount,
    total_characters: params.totalCharacters,
  });
}

/**
 * 下载内容
 */
export async function logDownload(contentType: 'audio' | 'video' | 'image'): Promise<void> {
  await logEvent('download', { content_type: contentType });
}

/**
 * 分享内容
 */
export async function logShare(contentType: string, method?: string): Promise<void> {
  await logEvent('share', {
    content_type: contentType,
    method: method || 'native',
  });
}

/**
 * 购买/订阅
 */
export async function logPurchase(params: {
  productId: string;
  price: number;
  currency: string;
}): Promise<void> {
  await logEvent('purchase', {
    item_id: params.productId,
    value: params.price,
    currency: params.currency,
  });
}

/**
 * 观看激励广告
 */
export async function logAdReward(adType: string): Promise<void> {
  await logEvent('ad_reward', { ad_type: adType });
}

/**
 * 功能使用
 */
export async function logFeatureUse(featureName: string): Promise<void> {
  await logEvent('feature_use', { feature_name: featureName });
}

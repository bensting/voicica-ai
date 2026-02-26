'use server';

/**
 * Voice Clone Server Actions
 *
 * Handles:
 * - Searching Fish Audio voice library
 * - Creating TTS with Fish Audio voices (direct, no queue)
 * - Creating voice clones (upload audio to Fish Audio)
 * - Managing user's cloned voices
 */

import { getDb } from '@/lib/db';
import { clonedVoices, ttsRecords } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { calculateVoiceCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { checkCredits, deductCredits } from '@/lib/credits';
import { synthesizeWithVoiceId, synthesizeWithReference } from '@/lib/services/fish-audio-tts';
import { searchFishModels, createFishModel, deleteFishModel } from '@/lib/services/fish-audio-model';
import type { FishAudioModel } from '@/lib/services/fish-audio-model';
import { uploadAudio } from '@/lib/services/r2-storage';

// ==================== Types ====================

export interface FishVoiceItem {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  languages: string[];
  tags: string[];
  sampleUrl: string | null;
  authorName: string;
  authorAvatar: string;
  likeCount: number;
  createdAt: string;
}

export interface SearchFishVoicesResult {
  total: number;
  items: FishVoiceItem[];
}

export interface CloneTtsResult {
  task_id: string;
  status: 'SUCCESS' | 'FAILURE';
  audio_url?: string;
  duration?: number;
  credits_cost?: number;
  record_id?: number;
  error?: string;
  errorCode?: string;
  errorData?: Record<string, unknown>;
}

export interface ClonedVoiceData {
  id: number;
  name: string;
  fishModelId: string;
  description: string | null;
  coverImageUrl: string | null;
  sampleAudioUrl: string | null;
  referenceText: string | null;
  status: string;
  createdAt: string;
}

export interface CreateVoiceCloneResult {
  success: boolean;
  clonedVoice?: ClonedVoiceData;
  error?: string;
}

// ==================== Helper ====================

const FISH_R2_CDN = 'https://public-platform.r2.fish.audio/cdn-cgi/image/width=200,format=webp';

function fishCoverUrl(coverImage: string | undefined): string {
  if (!coverImage) return '';
  // coverImage is like "coverimage/{id}" — prepend CDN base
  return `${FISH_R2_CDN}/${coverImage}`;
}

function mapFishModel(model: FishAudioModel): FishVoiceItem {
  const sample = model.samples?.[0];
  return {
    id: model._id,
    title: model.title,
    description: model.description,
    coverImage: fishCoverUrl(model.cover_image),
    languages: model.languages || [],
    tags: model.tags || [],
    sampleUrl: sample?.audio || sample?.url || null,
    authorName: model.author?.nickname || '',
    authorAvatar: '',
    likeCount: model.like_count || 0,
    createdAt: model.created_at,
  };
}

// ==================== Search Fish Voices ====================

/**
 * Search Fish Audio voice library
 */
export async function searchFishVoices(
  query?: string,
  page: number = 1,
  pageSize: number = 20,
  language?: string,
): Promise<SearchFishVoicesResult> {
  try {
    const result = await searchFishModels({
      title: query || undefined,
      pageNumber: page,
      pageSize,
      language: language || undefined,
      sortBy: 'score',
    });

    return {
      total: result.total,
      items: result.items.map(mapFishModel),
    };
  } catch (error) {
    console.error('searchFishVoices failed:', error);
    return { total: 0, items: [] };
  }
}

// ==================== Generate TTS with Fish Voice ====================

/**
 * Generate TTS using a Fish Audio voice (direct, no queue)
 *
 * For library voices: uses reference_id (fishVoiceId)
 * For cloned voices: also uses reference_id (fishModelId from cloned_voices)
 */
export async function createCloneTtsTask(params: {
  text: string;
  fishVoiceId: string;
  voiceName?: string;
  language?: string;
  platform?: string;
}): Promise<CloneTtsResult> {
  const db = await getDb();
  console.log('🐟 [createCloneTtsTask] Starting Fish Audio TTS generation');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    // 1. Calculate credits (clone rate: 1 per 100 chars)
    const requiredCredits = calculateVoiceCost(params.text.length, 'clone');

    // 2. Check credits
    const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);
    if (!hasEnough) {
      throw new InsufficientCreditsError(requiredCredits, current);
    }

    // 3. Generate task ID
    const taskId = uuidv4();
    const shareId = nanoid(8);

    // 4. Deduct credits
    await deductCredits(
      userId,
      requiredCredits,
      ProductType.VOICE_CLONING,
      isAnonymous,
      `Clone TTS: ${params.text.substring(0, 30)}${params.text.length > 30 ? '...' : ''}`,
      taskId
    );

    // 5. Call Fish Audio TTS API directly
    const result = await synthesizeWithVoiceId(params.text, params.fishVoiceId, {
      format: 'mp3',
      mp3_bitrate: 128,
    });

    // 6. Upload to R2
    const fileName = `${taskId}.${result.format}`;
    const audioUrl = await uploadAudio(
      result.audioData,
      fileName,
      'audio/mpeg',
      `clone_tts/${userId}`
    );

    // 7. Create TTS record
    const [record] = await db.insert(ttsRecords).values({
      userId,
      taskId,
      text: params.text,
      voiceName: params.voiceName || `fish:${params.fishVoiceId}`,
      language: params.language || null,
      style: `fish:${params.fishVoiceId}`,
      speed: 1.0,
      pitch: 50,
      volume: 50,
      creditsCost: requiredCredits,
      characterCount: params.text.length,
      status: 'SUCCESS',
      progress: 100,
      audioUrl,
      duration: result.duration,
      format: result.format,
      shareId,
      completedAt: new Date().toISOString(),
      platform: params.platform || null,
    }).returning();

    console.log(`Fish Audio TTS success: ${taskId}, duration=${result.duration}s`);

    return {
      task_id: taskId,
      status: 'SUCCESS',
      audio_url: audioUrl,
      duration: result.duration,
      credits_cost: requiredCredits,
      record_id: record.id,
    };
  } catch (error) {
    console.error('createCloneTtsTask failed:', error);
    const errorResponse = errorToResponse(error);
    return {
      task_id: '',
      status: 'FAILURE',
      ...errorResponse,
    };
  }
}

/**
 * Generate TTS using reference audio (real-time cloning, no saved model)
 */
export async function createRealtimeCloneTtsTask(params: {
  text: string;
  referenceAudioBase64: string;
  referenceText: string;
  platform?: string;
}): Promise<CloneTtsResult> {
  const db = await getDb();
  console.log('🐟 [createRealtimeCloneTtsTask] Starting real-time clone TTS');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    const requiredCredits = calculateVoiceCost(params.text.length, 'clone');

    const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);
    if (!hasEnough) {
      throw new InsufficientCreditsError(requiredCredits, current);
    }

    const taskId = uuidv4();
    const shareId = nanoid(8);

    await deductCredits(
      userId,
      requiredCredits,
      ProductType.VOICE_CLONING,
      isAnonymous,
      `Realtime Clone TTS: ${params.text.substring(0, 30)}${params.text.length > 30 ? '...' : ''}`,
      taskId
    );

    const audioBuffer = Buffer.from(params.referenceAudioBase64, 'base64');
    const result = await synthesizeWithReference(
      params.text,
      audioBuffer,
      params.referenceText,
      { format: 'mp3', mp3_bitrate: 128 }
    );

    const fileName = `${taskId}.${result.format}`;
    const audioUrl = await uploadAudio(
      result.audioData,
      fileName,
      'audio/mpeg',
      `clone_tts/${userId}`
    );

    const [record] = await db.insert(ttsRecords).values({
      userId,
      taskId,
      text: params.text,
      voiceName: 'fish:realtime-clone',
      language: null,
      style: null,
      speed: 1.0,
      pitch: 50,
      volume: 50,
      creditsCost: requiredCredits,
      characterCount: params.text.length,
      status: 'SUCCESS',
      progress: 100,
      audioUrl,
      duration: result.duration,
      format: result.format,
      shareId,
      completedAt: new Date().toISOString(),
      platform: params.platform || null,
    }).returning();

    return {
      task_id: taskId,
      status: 'SUCCESS',
      audio_url: audioUrl,
      duration: result.duration,
      credits_cost: requiredCredits,
      record_id: record.id,
    };
  } catch (error) {
    console.error('createRealtimeCloneTtsTask failed:', error);
    const errorResponse = errorToResponse(error);
    return {
      task_id: '',
      status: 'FAILURE',
      ...errorResponse,
    };
  }
}

// ==================== Voice Clone Management ====================

/**
 * Create a voice clone by uploading audio to Fish Audio
 */
export async function createVoiceClone(params: {
  name: string;
  description?: string;
  audioBase64: string;
  audioFileName: string;
  referenceText?: string;
}): Promise<CreateVoiceCloneResult> {
  const db = await getDb();
  console.log('🐟 [createVoiceClone] Creating voice clone:', params.name);

  try {
    const unifiedUser = await getUserOrAnonymous();
    if (unifiedUser.is_anonymous) {
      return { success: false, error: 'Login required to clone voices' };
    }
    const userId = unifiedUser.user_id;

    const audioBuffer = Buffer.from(params.audioBase64, 'base64');

    // Create Fish Audio model
    const fishModel = await createFishModel({
      title: params.name,
      description: params.description,
      audioBuffer,
      audioFileName: params.audioFileName || 'recording.mp3',
      referenceText: params.referenceText,
      visibility: 'private',
      trainMode: 'fast',
    });

    // Upload sample audio to R2 for our own storage
    const sampleFileName = `${fishModel._id}_sample.mp3`;
    const sampleAudioUrl = await uploadAudio(
      audioBuffer,
      sampleFileName,
      'audio/mpeg',
      `clone_samples/${userId}`
    );

    // Save to database
    const [clonedVoice] = await db.insert(clonedVoices).values({
      userId,
      name: params.name,
      fishModelId: fishModel._id,
      description: params.description || null,
      coverImageUrl: fishModel.cover_image || null,
      sampleAudioUrl,
      referenceText: params.referenceText,
      status: fishModel.state === 'trained' ? 'READY' : 'TRAINING',
    }).returning();

    console.log(`Voice clone created: ${clonedVoice.id}, fishModelId: ${fishModel._id}`);

    return {
      success: true,
      clonedVoice: {
        id: clonedVoice.id,
        name: clonedVoice.name,
        fishModelId: clonedVoice.fishModelId,
        description: clonedVoice.description,
        coverImageUrl: clonedVoice.coverImageUrl,
        sampleAudioUrl: clonedVoice.sampleAudioUrl,
        referenceText: clonedVoice.referenceText,
        status: clonedVoice.status,
        createdAt: clonedVoice.createdAt,
      },
    };
  } catch (error) {
    console.error('createVoiceClone failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create voice clone',
    };
  }
}

/**
 * Get user's cloned voices
 */
export async function getMyClonedVoices(): Promise<ClonedVoiceData[]> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  if (unifiedUser.is_anonymous) return [];

  const userId = unifiedUser.user_id;
  const voices = await db.select()
    .from(clonedVoices)
    .where(eq(clonedVoices.userId, userId))
    .orderBy(desc(clonedVoices.createdAt));

  return voices.map((v) => ({
    id: v.id,
    name: v.name,
    fishModelId: v.fishModelId,
    description: v.description,
    coverImageUrl: v.coverImageUrl,
    sampleAudioUrl: v.sampleAudioUrl,
    referenceText: v.referenceText,
    status: v.status,
    createdAt: v.createdAt,
  }));
}

/**
 * Delete a cloned voice
 */
export async function deleteClonedVoice(id: number): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  try {
    const unifiedUser = await getUserOrAnonymous();
    if (unifiedUser.is_anonymous) {
      return { success: false, error: 'Login required' };
    }
    const userId = unifiedUser.user_id;

    const [voice] = await db.select()
      .from(clonedVoices)
      .where(and(eq(clonedVoices.id, id), eq(clonedVoices.userId, userId)))
      .limit(1);

    if (!voice) {
      return { success: false, error: 'Voice not found' };
    }

    // Delete from Fish Audio
    try {
      await deleteFishModel(voice.fishModelId);
    } catch (err) {
      console.error('Failed to delete Fish model:', err);
      // Continue with local deletion even if Fish API fails
    }

    // Delete from database
    await db.delete(clonedVoices).where(eq(clonedVoices.id, id));

    return { success: true };
  } catch (error) {
    console.error('deleteClonedVoice failed:', error);
    return { success: false, error: 'Failed to delete voice' };
  }
}

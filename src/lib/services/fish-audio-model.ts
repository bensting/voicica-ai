/**
 * Fish Audio Model API Service
 * https://docs.fish.audio/api-reference/
 *
 * Provides functions to search, create, get, and delete Fish Audio voice models.
 */

/** Fish Audio model item from list/search API */
export interface FishAudioModel {
  _id: string;
  title: string;
  description: string;
  cover_image: string;
  train_mode: string;
  state: string;
  tags: string[];
  samples: FishAudioSample[];
  created_at: string;
  updated_at: string;
  languages: string[];
  like_count: number;
  mark_count: number;
  shared: boolean;
  author: {
    _id: string;
    nickname: string;
    avatar: string;
  };
}

export interface FishAudioSample {
  url: string;
  text: string;
  task_id: string | null;
}

/** Search/list response */
export interface FishAudioModelListResponse {
  total: number;
  items: FishAudioModel[];
}

/** Create model request params */
export interface CreateFishModelParams {
  /** Voice name */
  title: string;
  /** Description */
  description?: string;
  /** Audio file buffer */
  audioBuffer: Buffer;
  /** Audio file name */
  audioFileName: string;
  /** Reference text (what the audio says) */
  referenceText: string;
  /** Tags */
  tags?: string[];
  /** Training mode: 'fast' or 'full' */
  trainMode?: 'fast' | 'full';
  /** Visibility: 'public' or 'private' */
  visibility?: 'public' | 'private';
}

function getApiKey(): string {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    throw new Error('FISH_AUDIO_API_KEY is not configured');
  }
  return apiKey;
}

/**
 * Search Fish Audio voice library
 */
export async function searchFishModels(params: {
  title?: string;
  pageNumber?: number;
  pageSize?: number;
  language?: string;
  tag?: string;
  self?: boolean;
  authorId?: string;
  sortBy?: 'score' | 'created_at' | 'task_count';
}): Promise<FishAudioModelListResponse> {
  const apiKey = getApiKey();

  const queryParams = new URLSearchParams();
  if (params.title) queryParams.set('title', params.title);
  if (params.pageNumber !== undefined) queryParams.set('page_number', String(params.pageNumber));
  if (params.pageSize !== undefined) queryParams.set('page_size', String(params.pageSize));
  if (params.language) queryParams.set('language', params.language);
  if (params.tag) queryParams.set('tag', params.tag);
  if (params.self) queryParams.set('self', 'true');
  if (params.authorId) queryParams.set('author_id', params.authorId);
  if (params.sortBy) queryParams.set('sort_by', params.sortBy);

  const url = `https://api.fish.audio/model?${queryParams.toString()}`;

  console.log(`🐟 Fish Audio: Searching models: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Fish Audio model search failed: ${response.status} - ${errorText}`);
    throw new Error(`Fish Audio model search failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    total: data.total ?? data.items?.length ?? 0,
    items: data.items ?? data ?? [],
  };
}

/**
 * Get a specific Fish Audio model by ID
 */
export async function getFishModel(modelId: string): Promise<FishAudioModel> {
  const apiKey = getApiKey();

  const response = await fetch(`https://api.fish.audio/model/${modelId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio get model failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Create a new Fish Audio voice model (clone)
 */
export async function createFishModel(params: CreateFishModelParams): Promise<FishAudioModel> {
  const apiKey = getApiKey();

  const formData = new FormData();
  formData.append('visibility', params.visibility || 'private');
  formData.append('type', 'tts');
  formData.append('title', params.title);
  if (params.description) {
    formData.append('description', params.description);
  }
  formData.append('train_mode', params.trainMode || 'fast');
  if (params.tags && params.tags.length > 0) {
    for (const tag of params.tags) {
      formData.append('tags', tag);
    }
  }

  // Add audio file as voice sample
  const audioBlob = new Blob([params.audioBuffer], { type: 'audio/mpeg' });
  formData.append('voices', audioBlob, params.audioFileName);
  formData.append('texts', params.referenceText);

  console.log(`🐟 Fish Audio: Creating model "${params.title}"`);

  const response = await fetch('https://api.fish.audio/model', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Fish Audio create model failed: ${response.status} - ${errorText}`);
    throw new Error(`Fish Audio create model failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`Fish Audio model created: ${result._id}`);

  return result;
}

/**
 * Delete a Fish Audio model
 */
export async function deleteFishModel(modelId: string): Promise<void> {
  const apiKey = getApiKey();

  const response = await fetch(`https://api.fish.audio/model/${modelId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio delete model failed: ${response.status} - ${errorText}`);
  }

  console.log(`Fish Audio model deleted: ${modelId}`);
}

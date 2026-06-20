/**
 * Cloudflare R2 Storage Service
 * 使用 AWS SDK S3 兼容 API
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 创建 S3 客户端（延迟初始化）
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Cloudflare R2 配置不完整，请检查环境变量');
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

/**
 * 上传音频到 R2
 */
export async function uploadAudio(
  audioData: Buffer,
  fileName: string,
  contentType: string = 'audio/mpeg',
  folder: string = 'tts_audio'
): Promise<string> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  const client = getS3Client();
  const key = `${folder}/${fileName}`;

  console.log(`📤 R2 上传: ${key}, 大小: ${audioData.length} bytes`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: audioData,
      ContentType: contentType,
    })
  );

  // 生成公开 URL
  let url: string;
  if (publicUrl) {
    url = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    url = `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }

  console.log(`✅ R2 上传成功: ${url}`);
  return url;
}

/**
 * 上传图片到 R2（用于头像等）
 */
export async function uploadImage(
  imageData: Buffer,
  fileName: string,
  contentType: string = 'image/jpeg',
  folder: string = 'avatars'
): Promise<string> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  const client = getS3Client();
  const key = `${folder}/${fileName}`;

  console.log(`📤 R2 上传图片: ${key}, 大小: ${imageData.length} bytes`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageData,
      ContentType: contentType,
    })
  );

  // 生成公开 URL
  let url: string;
  if (publicUrl) {
    url = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    url = `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }

  console.log(`✅ R2 图片上传成功: ${url}`);
  return url;
}

/**
 * 删除 R2 中的音频
 */
export async function deleteAudio(filePath: string): Promise<boolean> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      })
    );
    console.log(`✅ R2 删除成功: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ R2 删除失败: ${filePath}`, error);
    return false;
  }
}

/**
 * 上传视频到 R2
 */
export async function uploadVideo(
  videoData: Buffer,
  fileName: string,
  contentType: string = 'video/mp4',
  folder: string = 'videos'
): Promise<string> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  const client = getS3Client();
  const key = `${folder}/${fileName}`;

  console.log(`📤 R2 上传视频: ${key}, 大小: ${videoData.length} bytes`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: videoData,
      ContentType: contentType,
    })
  );

  // 生成公开 URL
  let url: string;
  if (publicUrl) {
    url = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    url = `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }

  console.log(`✅ R2 视频上传成功: ${url}`);
  return url;
}

/**
 * 删除 R2 中的视频
 */
export async function deleteVideo(filePath: string): Promise<boolean> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      })
    );
    console.log(`✅ R2 视频删除成功: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ R2 视频删除失败: ${filePath}`, error);
    return false;
  }
}

/**
 * 上传 APK 到 R2
 */
export async function uploadApk(
  apkData: Buffer,
  fileName: string,
  folder: string = 'app_releases'
): Promise<string> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  const client = getS3Client();
  const key = `${folder}/${fileName}`;

  console.log(`📤 R2 上传 APK: ${key}, 大小: ${apkData.length} bytes`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: apkData,
      ContentType: 'application/vnd.android.package-archive',
    })
  );

  // 生成公开 URL
  let url: string;
  if (publicUrl) {
    url = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    url = `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }

  console.log(`✅ R2 APK 上传成功: ${url}`);
  return url;
}

/**
 * 删除 R2 中的 APK
 */
export async function deleteApk(filePath: string): Promise<boolean> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      })
    );
    console.log(`✅ R2 APK 删除成功: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ R2 APK 删除失败: ${filePath}`, error);
    return false;
  }
}

/**
 * 生成图片上传的预签名 URL
 * 用于客户端直传 R2
 */
export async function generateImageUploadUrl(
  fileName: string,
  contentType: string = 'image/jpeg',
  folder: string = 'voice-avatars',
  expiresIn: number = 3600 // 默认 1 小时有效期
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  const client = getS3Client();
  const key = `${folder}/${fileName}`;

  console.log(`🔑 生成图片预签名 URL: ${key}`);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  // 生成公开访问 URL
  let filePublicUrl: string;
  if (publicUrl) {
    filePublicUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    filePublicUrl = `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }

  console.log(`✅ 图片预签名 URL 生成成功: ${key}`);

  return {
    uploadUrl,
    publicUrl: filePublicUrl,
    key,
  };
}

/**
 * 生成 APK 上传的预签名 URL
 * 用于绕过 Vercel Server Action 4.5MB 限制，实现客户端直传 R2
 */
export async function generateApkUploadUrl(
  fileName: string,
  folder: string = 'app_releases',
  expiresIn: number = 3600 // 默认 1 小时有效期
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  const client = getS3Client();
  const key = `${folder}/${fileName}`;

  console.log(`🔑 生成 APK 预签名 URL: ${key}`);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: 'application/vnd.android.package-archive',
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  // 生成公开访问 URL
  let filePublicUrl: string;
  if (publicUrl) {
    filePublicUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    filePublicUrl = `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }

  console.log(`✅ 预签名 URL 生成成功: ${key}`);

  return {
    uploadUrl,
    publicUrl: filePublicUrl,
    key,
  };
}

/**
 * 从 URL 下载文件（带重试）
 * cover 图片可能在音频就绪后仍未上传完成，需要重试
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'image/*, audio/*, */*',
        },
      });
      if (response.ok) return response;
      console.warn(`📥 [R2 Upload] 下载失败 (${attempt}/${maxRetries}): ${response.status}`);
    } catch (error) {
      console.warn(`📥 [R2 Upload] 下载异常 (${attempt}/${maxRetries}):`, error);
    }
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return null;
}

/**
 * 从外部 URL 下载文件并上传到 R2
 * 用于将第三方 CDN 的音频/封面迁移到自有 R2 存储
 */
export async function downloadAndUploadToR2(
  url: string,
  taskId: string,
  type: 'audio' | 'cover',
  trackIndex: number = 1
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载文件: ${url}`);

    // cover 用重试（图片可能延迟就绪，最多等 ~15 秒），audio 直接下载
    const response = type === 'cover'
      ? await fetchWithRetry(url, 5, 3000)
      : await fetchWithRetry(url, 1, 0);

    if (!response) {
      console.error(`📥 [R2 Upload] 下载最终失败: ${url}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const suffix = trackIndex > 1 ? `_v${trackIndex}` : '';

    if (type === 'audio') {
      const fileName = `${taskId}${suffix}.mp3`;
      const r2Url = await uploadAudio(buffer, fileName, 'audio/mpeg', 'music_audio');
      console.log(`✅ [R2 Upload] 音频上传成功: ${r2Url}`);
      return r2Url;
    } else {
      const fileName = `${taskId}${suffix}.jpg`;
      const r2Url = await uploadImage(buffer, fileName, 'image/jpeg', 'music_covers');
      console.log(`✅ [R2 Upload] 封面上传成功: ${r2Url}`);
      return r2Url;
    }
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

/**
 * 删除 R2 中的 RVC 模型文件
 */
export async function deleteRvcModelFile(filePath: string): Promise<boolean> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME 未配置');
  }

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      })
    );
    console.log(`✅ R2 RVC 模型文件删除成功: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ R2 RVC 模型文件删除失败: ${filePath}`, error);
    return false;
  }
}

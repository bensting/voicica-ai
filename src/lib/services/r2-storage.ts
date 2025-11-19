/**
 * Cloudflare R2 Storage Service
 * 使用 AWS SDK S3 兼容 API
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

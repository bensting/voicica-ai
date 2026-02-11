/**
 * Firebase ID Token 验证器（基于 jose）
 *
 * 替换 firebase-admin SDK，使用纯 JS 实现，兼容 Cloudflare Workers / Edge Runtime
 * 通过 Google JWKS 端点获取公钥，验证 JWT 签名和 Firebase 标准 claims
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS_URL = new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');

const jwks = createRemoteJWKSet(GOOGLE_JWKS_URL);

export interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  auth_time: number;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  firebase: {
    sign_in_provider?: string;
    identities?: Record<string, unknown>;
  };
}

function getProjectId(): string {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase project ID 未配置: 请设置 FIREBASE_ADMIN_PROJECT_ID 或 NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  return projectId;
}

/**
 * 验证 Firebase ID Token
 *
 * @param token - Firebase ID Token (JWT)
 * @returns 解码后的 token payload，兼容 firebase-admin 的 DecodedIdToken
 */
export async function verifyIdToken(token: string): Promise<FirebaseDecodedToken> {
  const projectId = getProjectId();

  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  // 验证 sub 必须存在且非空
  if (!payload.sub) {
    throw new Error('Invalid token: missing sub claim');
  }

  // 验证 auth_time 必须是过去的时间
  const authTime = payload.auth_time as number | undefined;
  if (typeof authTime !== 'number' || authTime > Math.floor(Date.now() / 1000)) {
    throw new Error('Invalid token: auth_time is in the future');
  }

  return {
    uid: payload.sub,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
    email_verified: payload.email_verified as boolean | undefined,
    auth_time: authTime,
    iss: payload.iss!,
    aud: payload.aud as string,
    exp: payload.exp!,
    iat: payload.iat!,
    sub: payload.sub,
    firebase: (payload.firebase as FirebaseDecodedToken['firebase']) || {},
  };
}

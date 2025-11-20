/**
 * Firebase Admin SDK 初始化
 *
 * 用于服务端验证 Firebase ID Token
 * 采用懒加载模式，避免构建时错误
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

function initializeFirebaseAdmin(): { app: App; auth: Auth } {
  // 如果已经初始化，直接返回
  if (adminApp && adminAuth) {
    return { app: adminApp, auth: adminAuth };
  }

  // 检查是否已有 Firebase Admin 实例
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    adminApp = existingApp;
    adminAuth = getAuth(existingApp);
    return { app: adminApp, auth: adminAuth };
  }

  // 从环境变量加载凭据
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_ADMIN_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_ADMIN_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_ADMIN_PRIVATE_KEY');

    const error = `Firebase Admin SDK 环境变量未配置: ${missing.join(', ')}\n` +
      `请检查 Vercel 环境变量设置,特别注意 FIREBASE_ADMIN_PRIVATE_KEY 需要包含外层引号。\n` +
      `详见: VERCEL_DEPLOYMENT_GUIDE.md`;

    console.error('❌ [Firebase Admin]', error);
    throw new Error(error);
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    adminAuth = getAuth(adminApp);
    console.log('✅ Firebase Admin SDK 初始化成功');

    return { app: adminApp, auth: adminAuth };
  } catch (error) {
    console.error('❌ Firebase Admin SDK 初始化失败:', error);
    throw error;
  }
}

// 懒加载的 Auth getter
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const { auth } = initializeFirebaseAdmin();
    return auth[prop as keyof Auth];
  },
});

// 懒加载的 App getter
const app = new Proxy({} as App, {
  get(_target, prop) {
    const { app } = initializeFirebaseAdmin();
    return app[prop as keyof App];
  },
});

export default app;

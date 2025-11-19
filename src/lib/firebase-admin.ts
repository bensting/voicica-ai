/**
 * Firebase Admin SDK 初始化
 *
 * 用于服务端验证 Firebase ID Token
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initializeFirebaseAdmin(): { app: App; auth: Auth } {
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    return {
      app: existingApp,
      auth: getAuth(existingApp),
    };
  }

  // 从环境变量加载凭据
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK 环境变量未配置');
  }

  try {
    const newApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    const newAuth = getAuth(newApp);
    console.log('Firebase Admin SDK 初始化成功');

    return {
      app: newApp,
      auth: newAuth,
    };
  } catch (error) {
    console.error('Firebase Admin SDK 初始化失败:', error);
    throw error;
  }
}

// 初始化
const { app, auth } = initializeFirebaseAdmin();

export { auth };
export default app;

import 'next-auth';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      appUserId?: string;
      credits?: number;
    } & DefaultSession['user'];
  }

  interface User {
    appUserId?: string;
  }
}

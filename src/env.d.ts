/**
 * Cloudflare environment bindings
 */

/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Cloudflare
      CLOUDFLARE_ACCOUNT_ID?: string;
      CLOUDFLARE_D1_DATABASE_ID?: string;
      CLOUDFLARE_API_TOKEN?: string;

      // Auth
      NEXTAUTH_SECRET?: string;
      NEXTAUTH_URL?: string;

      // Google OAuth
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;

      // Apple OAuth
      APPLE_CLIENT_ID?: string;
      APPLE_CLIENT_SECRET?: string;

      // Stripe
      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
    }
  }
}

export {};
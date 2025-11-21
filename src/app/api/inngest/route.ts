import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processTtsTask } from '@/lib/inngest/functions/process-tts';

// Inngest API handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTtsTask],
  // Signing key for verifying requests from Inngest (required in production)
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

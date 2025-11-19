import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processTtsTask } from '@/lib/inngest/functions/process-tts';

export const runtime = 'edge';

// Inngest API handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTtsTask],
});

import { Inngest } from 'inngest';

// Create Inngest client
export const inngest = new Inngest({
  id: 'ai-voice-labs',
  // Optional: Add event schemas for type safety
});

// Event types
export interface TtsTaskCreatedEvent {
  name: 'tts/task.created';
  data: {
    taskId: string;
    userId: string;
    text: string;
    voiceName: string;
    language?: string;
    speed: number;
    pitch: number;
    volume: number;
    creditsCost: number;
    isAnonymous: boolean;
  };
}

export type InngestEvents = TtsTaskCreatedEvent;

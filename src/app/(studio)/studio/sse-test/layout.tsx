'use client';

import { CreditsProvider } from '@/contexts/CreditsContext';

/**
 * SSE Test Layout
 *
 * Provides CreditsProvider for SSE testing page
 * Note: SSE connection is manually controlled in the test page
 */
export default function SSETestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreditsProvider enableSSE={false}>
      {children}
    </CreditsProvider>
  );
}
/**
 * Lightweight Stripe REST API client
 *
 * Replaces the heavy `stripe` npm package with direct fetch calls
 * to avoid CF Workers memory limits.
 */

const STRIPE_API = 'https://api.stripe.com';

function getApiKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return key;
}

// ─── Types (only what we actually use) ───

export interface CheckoutSession {
  id: string;
  url: string | null;
  payment_status: string;
  status: string;
  currency: string | null;
  mode: string;
  amount_total: number | null;
  metadata: Record<string, string>;
  subscription: string | null;
  customer_email: string | null;
  line_items?: { data: Array<{ amount_total?: number; currency?: string }> };
}

export interface Subscription {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  customer: string | { id: string };
  cancellation_details?: { reason?: string };
  items: {
    data: Array<{
      current_period_start: number;
      current_period_end: number;
    }>;
  };
}

export interface Invoice {
  id: string;
  billing_reason: string | null;
  amount_paid: number;
  currency: string;
  subscription: string | null;
  metadata: Record<string, string>;
  lines?: {
    data: Array<{
      parent?: {
        subscription_item_details?: {
          subscription?: string;
        };
      };
      price?: { product?: string };
    }>;
  };
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

// ─── Generic request helper ───

/**
 * Flatten nested objects into Stripe's form-encoded format.
 * e.g. { line_items: [{ price_data: { currency: 'usd' } }] }
 * becomes { 'line_items[0][price_data][currency]': 'usd' }
 */
function flattenParams(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (value === null || value === undefined) {
      continue;
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'object' && value[i] !== null) {
          Object.assign(result, flattenParams(value[i] as Record<string, unknown>, `${fullKey}[${i}]`));
        } else {
          result[`${fullKey}[${i}]`] = String(value[i]);
        }
      }
    } else if (typeof value === 'object') {
      Object.assign(result, flattenParams(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }

  return result;
}

async function stripeRequest<T>(
  method: string,
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${getApiKey()}`,
  };

  let body: string | undefined;
  if (params && Object.keys(params).length > 0) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const flat = flattenParams(params);
    body = new URLSearchParams(flat).toString();
  }

  const res = await fetch(`${STRIPE_API}${path}`, { method, headers, body });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message
      || `Stripe ${method} ${path} failed: ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ─── Checkout Sessions ───

export function createCheckoutSession(
  params: Record<string, unknown>,
): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>('POST', '/v1/checkout/sessions', params);
}

export function retrieveCheckoutSession(id: string): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>('GET', `/v1/checkout/sessions/${id}`);
}

export function expireCheckoutSession(id: string): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>('POST', `/v1/checkout/sessions/${id}/expire`);
}

// ─── Subscriptions ───

export function cancelStripeSubscription(
  id: string,
  params?: Record<string, unknown>,
): Promise<Subscription> {
  return stripeRequest<Subscription>('DELETE', `/v1/subscriptions/${id}`, params);
}

export function retrieveSubscription(id: string): Promise<Subscription> {
  return stripeRequest<Subscription>('GET', `/v1/subscriptions/${id}`);
}

// ─── Webhook signature verification (Web Crypto API) ───

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify Stripe webhook signature using Web Crypto API (CF Workers compatible).
 * Throws on invalid signature or stale timestamp.
 */
export async function verifyWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string,
): Promise<WebhookEvent> {
  // Parse header: t=timestamp,v1=hash
  const parts = signatureHeader.split(',');
  let timestamp = '';
  let v1Signature = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') v1Signature = value;
  }

  if (!timestamp || !v1Signature) {
    throw new Error('Invalid Stripe signature header format');
  }

  // Check timestamp tolerance (5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > 300) {
    throw new Error('Stripe webhook timestamp too old');
  }

  // Compute HMAC-SHA256
  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(payload)),
  );

  const expectedSignature = bytesToHex(signatureBytes);

  // Constant-time comparison
  if (expectedSignature.length !== v1Signature.length) {
    throw new Error('Webhook signature verification failed');
  }

  const a = hexToBytes(expectedSignature);
  const b = hexToBytes(v1Signature);
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }

  if (diff !== 0) {
    throw new Error('Webhook signature verification failed');
  }

  return JSON.parse(body) as WebhookEvent;
}

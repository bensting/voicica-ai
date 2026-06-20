import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

function makeD1DevProxy(accountId: string, databaseId: string, token: string) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const callApi = async (sql: string, params: unknown[]) => {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await resp.json() as any;
    if (!data.success) throw new Error(data.errors?.[0]?.message ?? 'D1 REST API error');
    return data.result[0];
  };

  const makeStmt = (sql: string, bindings: unknown[] = []) => ({
    bind(...values: unknown[]) { return makeStmt(sql, values); },
    async first(col?: string) {
      const r = await callApi(sql, bindings);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = (r.results?.[0] ?? null) as any;
      return col !== undefined ? (row?.[col] ?? null) : row;
    },
    async all() { return callApi(sql, bindings); },
    async run() { return callApi(sql, bindings); },
    async raw() {
      const r = await callApi(sql, bindings);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (r.results ?? []).map((row: any) => Object.values(row));
    },
  });

  return {
    prepare: (sql: string) => makeStmt(sql),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch: (stmts: any[]) => Promise.all(stmts.map((s: any) => s.all())),
    dump: () => Promise.reject(new Error('dump() not supported in dev')),
    exec: async (sql: string) => { await callApi(sql, []); return { count: 1, duration: 0 }; },
  };
}

export async function getDb() {
  if (process.env.NODE_ENV === 'development') {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const databaseId = process.env.D1_DATABASE_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !databaseId || !token) {
      throw new Error('本地 dev 需在 .env.local 配置 CLOUDFLARE_ACCOUNT_ID / D1_DATABASE_ID / CLOUDFLARE_API_TOKEN');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return drizzle(makeD1DevProxy(accountId, databaseId, token) as any, { schema });
  }

  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const { env } = await getCloudflareContext();
  return drizzle(env.DB, { schema });
}

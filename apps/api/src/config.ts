import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

function looksLikePostgresUrl(value: unknown): value is string {
  return typeof value === 'string' && (value.startsWith('postgresql://') || value.startsWith('postgres://'));
}

function encodeCredentialPart(value: string) {
  // Avoid double-encoding: decode if possible, then encode.
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // keep as-is
  }
  return encodeURIComponent(decoded);
}

function normalizePostgresUrl(raw: string) {
  if (!looksLikePostgresUrl(raw)) return raw;

  const trimmed = raw.trim();
  const schemeEnd = trimmed.indexOf('://') + 3;
  if (schemeEnd < 3) return trimmed;

  const scheme = trimmed.slice(0, schemeEnd);
  const rest = trimmed.slice(schemeEnd);

  const slashIndex = rest.indexOf('/');
  const authorityEnd = slashIndex === -1 ? rest.length : slashIndex;
  const authority = rest.slice(0, authorityEnd);
  const afterAuthority = rest.slice(authorityEnd);

  if (!authority.includes('@')) return trimmed;

  const atIndex = authority.lastIndexOf('@');
  const userInfo = authority.slice(0, atIndex);
  const hostPort = authority.slice(atIndex + 1);

  // Only normalize URLs that include a password segment (`user:pass@host`).
  const colonIndex = userInfo.indexOf(':');
  if (colonIndex === -1) return trimmed;

  const user = userInfo.slice(0, colonIndex);
  const password = userInfo.slice(colonIndex + 1);

  const rebuilt = `${scheme}${encodeCredentialPart(user)}:${encodeCredentialPart(password)}@${hostPort}${afterAuthority}`;

  try {
    const url = new URL(rebuilt);
    url.hash = '';

    if (!url.searchParams.has('schema')) url.searchParams.set('schema', 'public');

    const host = url.hostname.toLowerCase();
    const isSupabase = host.endsWith('.supabase.co') || host.endsWith('.supabase.com');
    if (isSupabase && !url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');

    return url.toString();
  } catch {
    return rebuilt;
  }
}

function parseEnvFile(contents: string) {
  const env: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trimStart() : line;
    const equalsIndex = normalized.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = normalized.slice(0, equalsIndex).trim();
    if (!key) continue;

    let value = normalized.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
}

function findRepoRoot(startDir: string) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

function loadMonorepoEnv() {
  const repoRoot = findRepoRoot(process.cwd());
  const preExistingKeys = new Set(Object.keys(process.env));

  const envDefault = readEnvFile(path.join(repoRoot, '.env'));
  const envLocal = readEnvFile(path.join(repoRoot, '.env.local'));

  for (const [key, value] of Object.entries(envDefault)) {
    if (!preExistingKeys.has(key)) process.env[key] = value;
  }

  // `.env.local` overrides `.env`, but never overrides real environment variables (Vercel/CI wins).
  for (const [key, value] of Object.entries(envLocal)) {
    if (!preExistingKeys.has(key)) process.env[key] = value;
  }

  // Same normalization as the Prisma helper scripts: allow raw Supabase credentials to be pasted,
  // then fix them into a valid Postgres URL.
  if (process.env.DATABASE_URL && looksLikePostgresUrl(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL = normalizePostgresUrl(process.env.DATABASE_URL);
  }

  if (process.env.DIRECT_URL && looksLikePostgresUrl(process.env.DIRECT_URL)) {
    process.env.DIRECT_URL = normalizePostgresUrl(process.env.DIRECT_URL);
  }
}

loadMonorepoEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  STORAGE_MODE: z.enum(['local', 'supabase']).default('local'),
  UPLOAD_BASE_URL: z.string().default('http://localhost:4000'),
  SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('ucc-pmp-files'),
});

const parsed = envSchema.superRefine((val, ctx) => {
  if (val.NODE_ENV !== 'test' && (!val.DATABASE_URL || val.DATABASE_URL.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message: 'DATABASE_URL is required (set it in repo root .env or .env.local)',
    });
  }

  const supabaseUrl = val.SUPABASE_URL ?? val.NEXT_PUBLIC_SUPABASE_URL;

  if (val.STORAGE_MODE === 'supabase') {
    if (!supabaseUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_URL'],
        message: 'SUPABASE_URL is required when STORAGE_MODE=supabase',
      });
    }

    if (!val.SUPABASE_SERVICE_ROLE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_SERVICE_ROLE_KEY'],
        message: 'SUPABASE_SERVICE_ROLE_KEY is required when STORAGE_MODE=supabase',
      });
    }
  }
}).parse(process.env);

export const env = {
  ...parsed,
  SUPABASE_URL: parsed.SUPABASE_URL ?? parsed.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: parsed.SUPABASE_ANON_KEY ?? parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

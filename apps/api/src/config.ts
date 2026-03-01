import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

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

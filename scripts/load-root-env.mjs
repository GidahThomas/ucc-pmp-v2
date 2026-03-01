import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function looksLikePostgresUrl(value) {
  return typeof value === 'string' && (value.startsWith('postgresql://') || value.startsWith('postgres://'));
}

function encodeCredentialPart(value) {
  // Avoid double-encoding: decode if possible, then encode.
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // keep as-is
  }
  return encodeURIComponent(decoded);
}

function normalizePostgresUrl(raw) {
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

function parseEnvFile(contents) {
  /** @type {Record<string, string>} */
  const env = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trimStart() : line;
    const equalsIndex = normalized.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = normalized.slice(0, equalsIndex).trim();
    if (!key) continue;

    let value = normalized.slice(equalsIndex + 1).trim();

    // Preserve `#` and other special characters in values. If users quote the value, remove quotes.
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

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
}

export function loadRootEnv() {
  // This file lives at `<repoRoot>/scripts/load-root-env.mjs`
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const preExistingKeys = new Set(Object.keys(process.env));

  const envDefault = readEnvFile(path.join(repoRoot, '.env'));
  const envLocal = readEnvFile(path.join(repoRoot, '.env.local'));

  for (const [key, value] of Object.entries(envDefault)) {
    if (!preExistingKeys.has(key)) process.env[key] = value;
  }

  // `.env.local` overrides `.env`, but we still do not override real environment variables
  // (CI/Vercel env vars win).
  for (const [key, value] of Object.entries(envLocal)) {
    if (!preExistingKeys.has(key)) process.env[key] = value;
  }

  // Normalize common Supabase/Postgres pitfalls:
  // - URL-encode passwords with `@`/`#` (common when users paste raw credentials)
  // - Ensure `sslmode=require` for Supabase hosts
  // - Ensure `schema=public` if omitted
  if (process.env.DATABASE_URL) process.env.DATABASE_URL = normalizePostgresUrl(process.env.DATABASE_URL);
  if (process.env.DIRECT_URL) process.env.DIRECT_URL = normalizePostgresUrl(process.env.DIRECT_URL);

  return repoRoot;
}

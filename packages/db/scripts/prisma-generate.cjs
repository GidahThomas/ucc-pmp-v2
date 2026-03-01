const { spawnSync } = require('node:child_process');

// `prisma generate` needs DATABASE_URL set (even though it does not connect),
// and CI/Vercel builds often run without it until env vars are configured.
const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/ucc_pmp_rebuild?schema=public';

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

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  process.env.DATABASE_URL = fallbackUrl;
}

if (!process.env.DIRECT_URL || process.env.DIRECT_URL.trim() === '') {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

process.env.DATABASE_URL = normalizePostgresUrl(process.env.DATABASE_URL);
process.env.DIRECT_URL = normalizePostgresUrl(process.env.DIRECT_URL);

const result = spawnSync('prisma', ['generate', '--schema', 'prisma/schema.prisma'], {
  stdio: 'inherit',
  // On Windows, the Prisma CLI is typically a `.cmd` shim.
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);

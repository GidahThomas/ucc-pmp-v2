import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { loadRootEnv } from './load-root-env.mjs';

const repoRoot = loadRootEnv();
const dbPackageDir = path.join(repoRoot, 'packages', 'db');

const args = process.argv.slice(2);

// `prisma generate` does not connect, but Prisma still requires the env var to exist.
// For commands that actually connect (migrate, studio, etc), missing DATABASE_URL should hard-fail
// so users don't think Supabase is connected when it's not.
const requiresDbUrl = args[0] !== 'generate' && args[0] !== 'format' && args[0] !== 'validate';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  if (requiresDbUrl) {
    console.error('Missing DATABASE_URL. Set it in repo root .env or .env.local and re-run.');
    process.exit(1);
  }

  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@localhost:5432/ucc_pmp_rebuild?schema=public';
}

if (!process.env.DIRECT_URL || process.env.DIRECT_URL.trim() === '') {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const result = spawnSync('prisma', args, {
  cwd: dbPackageDir,
  stdio: 'inherit',
  // On Windows, the Prisma CLI is typically a `.cmd` shim.
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);


import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { loadRootEnv } from './load-root-env.mjs';

const repoRoot = loadRootEnv();
const dbPackageDir = path.join(repoRoot, 'packages', 'db');

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  console.error('Missing DATABASE_URL. Set it in repo root .env or .env.local and re-run.');
  process.exit(1);
}

if (!process.env.DIRECT_URL || process.env.DIRECT_URL.trim() === '') {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

// Seed scripts should use the migration connection (DIRECT_URL) instead of the pooled runtime URL.
// This avoids common PgBouncer transaction-pooling limitations during scripted writes.
process.env.DATABASE_URL = process.env.DIRECT_URL;

const result = spawnSync('tsx', ['prisma/seed.ts'], {
  cwd: dbPackageDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);

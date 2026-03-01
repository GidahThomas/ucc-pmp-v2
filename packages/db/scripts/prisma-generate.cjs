const { spawnSync } = require('node:child_process');

// `prisma generate` needs DATABASE_URL set (even though it does not connect),
// and CI/Vercel builds often run without it until env vars are configured.
const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/ucc_pmp_rebuild?schema=public';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  process.env.DATABASE_URL = fallbackUrl;
}

if (!process.env.DIRECT_URL || process.env.DIRECT_URL.trim() === '') {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const result = spawnSync('prisma', ['generate', '--schema', 'prisma/schema.prisma'], {
  stdio: 'inherit',
  // On Windows, the Prisma CLI is typically a `.cmd` shim.
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);

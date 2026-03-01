import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  return repoRoot;
}


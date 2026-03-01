import { cp, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('apps', 'web', 'dist');
const targetDir = path.resolve('dist');

try {
  await stat(sourceDir);
} catch {
  console.error(`Expected web build output at: ${sourceDir}`);
  process.exit(1);
}

await rm(targetDir, { recursive: true, force: true });
await cp(sourceDir, targetDir, { recursive: true });

console.log(`Synced ${sourceDir} -> ${targetDir}`);

import { cpSync, existsSync, rmSync } from 'node:fs';

const source = 'apps/web/out';
const destination = 'build';

if (!existsSync(source)) {
  throw new Error(`Static export was not created at ${source}`);
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
console.log(`Prepared Render publish directory: ${destination}`);

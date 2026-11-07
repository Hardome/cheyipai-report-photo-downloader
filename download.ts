import path from 'node:path';
import { fileURLToPath } from 'node:url';
export * from './src/index.js';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { main } = await import('./src/cli.js');
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

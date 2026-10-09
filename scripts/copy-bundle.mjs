import { copyFile } from 'node:fs/promises';

await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../OPSYREX.html', import.meta.url));
console.log('Created OPSYREX.html (self-contained app bundle)');

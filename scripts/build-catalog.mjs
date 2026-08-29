import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const toolsDir = path.resolve('tools');
const output = path.resolve('data/tools.json');

const entries = await readdir(toolsDir, { withFileTypes: true });
const tools = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const manifestPath = path.join(toolsDir, entry.name, 'manifest.json');
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (!manifest.id || !manifest.name || !manifest.url) {
      throw new Error(`Manifesto incompleto em ${entry.name}`);
    }
    tools.push({
      ...manifest,
      url: manifest.url.replace(/^\.\.\/\.\.\//, './'),
      coverType: manifest.coverType || (manifest.id === 'videoquiz' ? 'video' : 'default')
    });
  } catch (error) {
    console.error(`[catalog] ${error.message}`);
    process.exitCode = 1;
  }
}

tools.sort((a, b) => {
  if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
  return a.name.localeCompare(b.name, 'pt-BR');
});

await writeFile(output, `${JSON.stringify(tools, null, 2)}\n`, 'utf8');
console.log(`[catalog] ${tools.length} ferramenta(s) registrada(s) em data/tools.json`);
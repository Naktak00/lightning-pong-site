import { open, readdir, readFile } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';

const [buildPath, outputPath] = process.argv.slice(2);
if (!buildPath || !outputPath) throw new Error('Usage: node tools/pack-private-playtest.mjs <build folder> <output file>');
const root = resolve(buildPath);
const index = Object.create(null);
const files = [];
let offset = 0;

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (path === join(root, 'src', 'server')) continue;
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) {
      const name = relative(root, path).split(sep).join('/');
      const contents = await readFile(path);
      index[name] = [offset, contents.length];
      files.push(contents);
      offset += contents.length;
    } else throw new Error(`Unexpected file type in playtest build: ${path}`);
  }
}

await collect(join(root, 'app'));
await collect(join(root, 'src'));
if (!index['app/index.html']) throw new Error('Missing app/index.html');
const encodedIndex = Buffer.from(JSON.stringify(index), 'utf8');
const size = Buffer.alloc(4);
size.writeUInt32BE(encodedIndex.length);
const output = await open(outputPath, 'wx');
try {
  await output.writeFile(Buffer.concat([size, encodedIndex, ...files]));
} finally {
  await output.close();
}
console.log(`Packed ${files.length} private game files.`);

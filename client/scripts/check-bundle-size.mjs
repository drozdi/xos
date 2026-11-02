import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const budget = 300 * 1024;
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((match) => match[1]);

if (refs.length === 0) {
	console.error('index.html has no startup scripts');
	process.exit(1);
}

let total = 0;
for (const ref of refs) {
	const bytes = gzipSync(readFileSync(join(dist, ref.replace(/^\//, '')))).length;
	total += bytes;
	console.log(`${bytes} ${ref}`);
}

console.log(`startup gzip ${total}`);
if (total > budget) {
	console.error(`startup gzip ${total} exceeds ${budget}`);
	process.exit(1);
}

const forbidden = ['pdfjs', 'mammoth', 'leaflet', 'highlight.js', '@tiptap', 'prosemirror'];
for (const ref of refs) {
	const text = readFileSync(join(dist, ref.replace(/^\//, '')), 'utf8');
	for (const marker of forbidden) {
		if (text.includes(marker)) {
			console.error(`${ref} contains ${marker}`);
			process.exit(1);
		}
	}
}

console.log('bundle checks ok');

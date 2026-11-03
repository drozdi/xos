import { readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const budget = 250 * 1024;
const entry = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((match) => match[1]);

if (entry.length === 0) {
	console.error('index.html has no startup scripts');
	process.exit(1);
}

const seen = new Set();
const queue = [...entry];
const importRe = /(?:^|[;\n])\s*import(?!\s*type\b)[\s\w{},*$]*?from\s*['"](\.[^'"]+)['"]|(?:^|[;\n])\s*import\s*['"](\.[^'"]+)['"]/gm;

function resolveImport(fromFile, spec) {
	const base = dirname(fromFile);
	let next = normalize(join(base, spec)).replace(/\\/g, '/');
	if (!next.endsWith('.js')) {
		next += '.js';
	}
	return next.startsWith('assets/') ? `/${next}` : next.startsWith('/') ? next : `/${next}`;
}

function stripPrefetchMaps(text) {
	return text.replace(/const __vite__mapDeps=[\s\S]*?;/g, '');
}

while (queue.length > 0) {
	const ref = queue.pop();
	if (!ref || seen.has(ref)) {
		continue;
	}
	seen.add(ref);
	const text = stripPrefetchMaps(readFileSync(join(dist, ref.replace(/^\//, '')), 'utf8'));
	importRe.lastIndex = 0;
	let match;
	while ((match = importRe.exec(text))) {
		const spec = match[1] || match[2];
		if (!spec) {
			continue;
		}
		queue.push(resolveImport(ref.replace(/^\//, ''), spec));
	}
}

let total = 0;
const forbidden = ['pdfjs', 'mammoth', 'leaflet', 'highlight.js', '@tiptap', 'prosemirror'];
for (const ref of seen) {
	const file = join(dist, ref.replace(/^\//, ''));
	const bytes = gzipSync(readFileSync(file)).length;
	total += bytes;
	console.log(`${bytes} ${ref}`);
	const text = readFileSync(file, 'utf8');
	for (const marker of forbidden) {
		if (text.includes(marker)) {
			console.error(`${ref} contains ${marker}`);
			process.exit(1);
		}
	}
}

console.log(`startup gzip ${total} files ${seen.size}`);
if (total > budget) {
	console.error(`startup gzip ${total} exceeds ${budget}`);
	process.exit(1);
}

console.log('bundle checks ok');

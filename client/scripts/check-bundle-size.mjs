import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets');
const desktopLimit = 1_500_000;
const mantineLimit = 1_500_000;
const forbiddenInShell = ['pdfjs', 'mammoth', 'leaflet', 'highlight.js', 'cytoscape', '@tiptap'];

function files(dir) {
	const found = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			found.push(...files(path));
			continue;
		}
		if (name.endsWith('.js')) {
			found.push({ name, path, size: stat.size });
		}
	}
	return found;
}

const jsFiles = files(assets);

function assertUnder(label, matches, limit) {
	const largest = matches.reduce((best, file) => (file.size > best.size ? file : best), {
		name: '',
		size: 0,
	});
	console.log(`${label} ${largest.size} ${largest.name}`);
	if (!largest.name) {
		console.error(`missing ${label} chunk`);
		process.exit(1);
	}
	if (largest.size > limit) {
		console.error(`${label} exceeds ${limit} bytes`);
		process.exit(1);
	}
}

const entry = jsFiles.filter((file) => file.name.startsWith('index-'));
const mantine = jsFiles.filter((file) => file.name.startsWith('mantine'));
assertUnder('desktop', entry, desktopLimit);
assertUnder('mantine', mantine, mantineLimit);

for (const file of [...entry, ...mantine]) {
	const text = readFileSync(file.path, 'utf8');
	for (const marker of forbiddenInShell) {
		if (text.includes(marker)) {
			console.error(`${file.name} contains ${marker} before its app is opened`);
			process.exit(1);
		}
	}
}

console.log('bundle checks ok');

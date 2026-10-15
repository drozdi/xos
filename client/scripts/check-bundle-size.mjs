import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const limit = 8 * 1024 * 1024;
let largest = 0;
let largestName = '';

function walk(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			walk(path);
			continue;
		}
		if (!name.endsWith('.js') || stat.size <= largest) {
			continue;
		}
		largest = stat.size;
		largestName = path;
	}
}

walk(root);
console.log(`largest js ${largest} ${largestName}`);
if (largest > limit) {
	console.error(`bundle exceeds ${limit} bytes`);
	process.exit(1);
}

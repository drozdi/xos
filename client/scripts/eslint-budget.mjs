import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const maxErrors = 101;
const maxWarnings = 214;

const result = spawnSync('npx', ['eslint', '.', '-f', 'json'], {
	cwd: fileURLToPath(new URL('..', import.meta.url)),
	encoding: 'utf8',
	shell: true,
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

let report;
try {
	report = JSON.parse(result.stdout || '[]');
} catch {
	console.error(result.stderr || result.stdout);
	process.exit(result.status || 1);
}

let errors = 0;
let warnings = 0;
for (const file of report) {
	errors += file.errorCount;
	warnings += file.warningCount;
}

console.log(`eslint errors ${errors} (max ${maxErrors}), warnings ${warnings} (max ${maxWarnings})`);
if (errors > maxErrors || warnings > maxWarnings) {
	console.error(result.stderr);
	process.exit(1);
}

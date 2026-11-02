import { spawnSync } from 'node:child_process';

const result = spawnSync(
	'npm',
	[
		'--prefix',
		'client',
		'exec',
		'--',
		'eslint',
		'--config',
		'client/eslint.config.js',
		'--fix',
		...process.argv.slice(2),
	],
	{ stdio: 'inherit', shell: true },
);

if ((result.status ?? 1) !== 0) {
	console.error('eslint reported issues in staged files; commit continues');
}

process.exit(0);

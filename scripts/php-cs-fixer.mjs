import { spawnSync } from 'node:child_process';

const candidates = [
	process.env.PHP_BIN,
	'php',
	'C:\\OSPanel\\modules\\PHP-8.4\\php.exe',
].filter((candidate) => typeof candidate === 'string' && candidate !== '');

function canRun(bin) {
	const result = spawnSync(bin, ['-v'], { stdio: 'ignore' });
	return result.status === 0;
}

const php = candidates.find((candidate) => canRun(candidate));
if (!php) {
	console.error('php not found; set PHP_BIN');
	process.exit(1);
}

const result = spawnSync(
	php,
	[
		'server/vendor/bin/php-cs-fixer',
		'fix',
		'--config=server/.php-cs-fixer.dist.php',
		...process.argv.slice(2),
	],
	{ stdio: 'inherit' },
);

if (result.error) {
	console.error(result.error.message);
}

process.exit(result.status ?? 1);

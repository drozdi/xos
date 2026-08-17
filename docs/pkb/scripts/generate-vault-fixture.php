#!/usr/bin/env php
<?php

/**
 * Generates N markdown files in a vault folder for indexing benchmarks.
 *
 * Usage: php docs/pkb/scripts/generate-vault-fixture.php [count] [outputDir]
 * Default: 100 files in ./var/pkb-fixture
 */

declare(strict_types=1);

$count = isset($argv[1]) ? max(1, (int) $argv[1]) : 100;
$outputDir = $argv[2] ?? dirname(__DIR__, 3).'/var/pkb-fixture';

$notesDir = rtrim($outputDir, '/\\').'/Notes';
if (!is_dir($notesDir) && !mkdir($notesDir, 0775, true) && !is_dir($notesDir)) {
    fwrite(STDERR, "Cannot create directory: {$notesDir}\n");
    exit(1);
}

$started = microtime(true);

for ($i = 1; $i <= $count; ++$i) {
    $slug = sprintf('note-%05d', $i);
    $path = $notesDir.'/'.$slug.'.md';
    $target = ($i % 10 === 0) ? sprintf('note-%05d', max(1, $i - 1)) : sprintf('note-%05d', min($count, $i + 1));
    $body = <<<MD
# {$slug}

Benchmark fixture note {$i}.

Tags: #benchmark #fixture

See also [[{$target}]] and keyword-{$i}.
MD;
    file_put_contents($path, $body);
}

$elapsed = microtime(true) - $started;

echo "Generated {$count} markdown files in {$notesDir}\n";
echo sprintf("Elapsed: %.3fs\n", $elapsed);

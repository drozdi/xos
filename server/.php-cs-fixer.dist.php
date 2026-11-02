<?php

$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__.'/src')
    ->name('*.php');

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(false)
    ->setRules([
        '@Symfony' => true,
        'yoda_style' => false,
    ])
    ->setFinder($finder);

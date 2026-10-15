<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Routing\RouterInterface;

#[AsCommand(name: 'app:openapi:dump', description: 'Write a path list from route attributes to var/openapi.json')]
final class OpenApiDumpCommand extends Command
{
    public function __construct(private readonly RouterInterface $router)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $paths = [];
        foreach ($this->router->getRouteCollection() as $name => $route) {
            if (!str_starts_with($route->getPath(), '/api')) {
                continue;
            }
            $methods = $route->getMethods() ?: ['GET'];
            foreach ($methods as $method) {
                $paths[$route->getPath()][strtolower($method)] = [
                    'operationId' => $name,
                    'responses' => ['200' => ['description' => 'OK']],
                ];
            }
        }
        ksort($paths);
        $document = [
            'openapi' => '3.0.3',
            'info' => ['title' => 'XOS', 'version' => '0.0.0'],
            'paths' => $paths,
        ];
        $target = dirname(__DIR__, 3).'/var/openapi.json';
        if (!is_dir(dirname($target))) {
            mkdir(dirname($target), 0777, true);
        }
        file_put_contents($target, json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $output->writeln(sprintf('Wrote %d paths to %s', count($paths), $target));

        return Command::SUCCESS;
    }
}

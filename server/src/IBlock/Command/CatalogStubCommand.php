<?php

namespace IBlock\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Prints a ContentCatalogConfig stub. List/detail UI is already shared
 * (ContentCatalogListApp / ContentCatalogDetailApp); new blocks only need this config.
 */
#[AsCommand(name: 'iblock:catalog-stub', description: 'Print a content catalog config for a block code')]
final class CatalogStubCommand extends Command
{
    protected function configure(): void
    {
        $this->addArgument('code', InputArgument::REQUIRED, 'Block code, for example notes');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $code = (string) $input->getArgument('code');
        $title = ucfirst($code);
        $output->writeln(<<<TS
        export const {$code}Catalog = {
        \tblockCode: '{$code}',
        \tlistTitle: '{$title}',
        \tdetailTitle: '{$title}',
        \tlistAppId: '{$code}s',
        \tdetailAppId: '{$code}',
        } satisfies ContentCatalogConfig;
        TS);

        return Command::SUCCESS;
    }
}

<?php

namespace Main\Command;

use Main\Service\ClaimantManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'main:claimant:sync',
    description: 'Sync claimants and access_options from module setting.json into DB'
)]
final class ClaimantSyncCommand extends Command
{
    public function __construct(
        private readonly ClaimantManager $claimantManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Validate and report without writing')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Overwrite access_options when can_* bits changed');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $force = (bool) $input->getOption('force');

        $report = $this->claimantManager->sync($dryRun, $force);

        $io->writeln(sprintf('upserted (%d): %s', count($report['upserted']), implode(', ', $report['upserted']) ?: '—'));
        $io->writeln(sprintf('orphan (%d): %s', count($report['orphan']), implode(', ', $report['orphan']) ?: '—'));

        if ([] !== $report['bit_changes']) {
            $io->warning('bit changes detected:');
            $io->listing($report['bit_changes']);
        }

        if ([] !== $report['errors']) {
            $io->error('errors:');
            $io->listing($report['errors']);

            return Command::FAILURE;
        }

        if ($report['aborted']) {
            $io->error('sync aborted');

            return Command::FAILURE;
        }

        if ($dryRun) {
            $io->success('dry-run OK (no DB writes)');
        } else {
            $io->success('sync completed');
        }

        return Command::SUCCESS;
    }
}

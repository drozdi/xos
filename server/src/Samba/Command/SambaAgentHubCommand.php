<?php

namespace Samba\Command;

use Samba\Service\AgentHub;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(name: 'samba:agent-hub', description: 'Сокеты агентов Samba и приём команд с центра')]
final class SambaAgentHubCommand extends Command
{
    public function __construct(
        private readonly AgentHub $hub,
        #[Autowire('%env(default::SAMBA_AGENT_HUB)%')]
        private readonly ?string $hubUrl = null,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $url = '' !== trim((string) $this->hubUrl) ? (string) $this->hubUrl : 'http://127.0.0.1:8766';
        $this->hub->listen($url);

        return Command::SUCCESS;
    }
}

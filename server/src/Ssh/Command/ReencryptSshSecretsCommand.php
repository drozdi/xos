<?php

namespace Ssh\Command;

use Doctrine\ORM\EntityManagerInterface;
use Ssh\Repository\SshConnectionRepository;
use Ssh\Repository\SshKeyRepository;
use Ssh\Service\SshSecretCipher;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(
    name: 'ssh:reencrypt-secrets',
    description: 'Re-encrypt SSH secrets from the old APP_SECRET to SSH_SECRET_KEY',
)]
final class ReencryptSshSecretsCommand extends Command
{
    public function __construct(
        private readonly SshSecretCipher $cipher,
        private readonly SshConnectionRepository $connections,
        private readonly SshKeyRepository $keys,
        private readonly EntityManagerInterface $entityManager,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('from-secret', null, InputOption::VALUE_REQUIRED, 'Previous APP_SECRET used to decrypt', '');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if (!$this->cipher->usesDedicatedKey()) {
            $output->writeln('<error>SSH_SECRET_KEY is empty. Set it before re-encrypting.</error>');

            return Command::FAILURE;
        }

        $from = (string) $input->getOption('from-secret');
        if ('' === $from) {
            $from = $this->appSecret;
        }

        $count = 0;
        foreach ($this->connections->findAll() as $connection) {
            $connection->setSecret($this->cipher->reencryptFrom($connection->getSecret(), $from));
            $passphrase = $connection->getPassphrase();
            if (null !== $passphrase && '' !== $passphrase) {
                $connection->setPassphrase($this->cipher->reencryptFrom($passphrase, $from));
            }
            ++$count;
        }
        foreach ($this->keys->findAll() as $key) {
            $key->setPrivateKey($this->cipher->reencryptFrom($key->getPrivateKey(), $from));
            $passphrase = $key->getPassphrase();
            if (null !== $passphrase && '' !== $passphrase) {
                $key->setPassphrase($this->cipher->reencryptFrom($passphrase, $from));
            }
            ++$count;
        }

        $this->entityManager->flush();
        $output->writeln(sprintf('Re-encrypted %d SSH records.', $count));

        return Command::SUCCESS;
    }
}

<?php

namespace App\Command;

use Doctrine\ORM\EntityManagerInterface;
use Github\Entity\UserGithubCredential;
use Github\Service\GithubTokenCipher;
use IncCom\Entity\UserFnsCredential;
use IncCom\Service\FnsTokenCipher;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Ts\Entity\UserTsCredential;
use Ts\Service\TsTokenCipher;

#[AsCommand(name: 'app:reencrypt-token-secrets', description: 'Re-encrypt stored API tokens with the current secrets')]
final class ReencryptTokenSecretsCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly FnsTokenCipher $fnsTokenCipher,
        private readonly TsTokenCipher $tsTokenCipher,
        private readonly GithubTokenCipher $githubTokenCipher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if (!$this->fnsTokenCipher->isEnabled() || !$this->tsTokenCipher->isEnabled() || !$this->githubTokenCipher->isEnabled()) {
            $output->writeln('<error>INCCOM_FNS_SECRET, TS_TOKEN_SECRET and GITHUB_TOKEN_SECRET must be set before re-encryption.</error>');

            return Command::FAILURE;
        }

        foreach ($this->entityManager->getRepository(UserFnsCredential::class)->findAll() as $credential) {
            $credential->setMasterToken($this->fnsTokenCipher->encrypt($this->fnsTokenCipher->decrypt($credential->getMasterToken())));
        }
        foreach ($this->entityManager->getRepository(UserTsCredential::class)->findAll() as $credential) {
            $credential->setPrivateToken($this->tsTokenCipher->encrypt($this->tsTokenCipher->decrypt($credential->getPrivateToken())));
        }
        foreach ($this->entityManager->getRepository(UserGithubCredential::class)->findAll() as $credential) {
            $credential->setAccessToken($this->githubTokenCipher->encrypt($this->githubTokenCipher->decrypt($credential->getAccessToken())));
        }
        $this->entityManager->flush();
        $output->writeln('Token secrets re-encrypted.');

        return Command::SUCCESS;
    }
}

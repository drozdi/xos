<?php

namespace Samba\Security;

use Samba\Entity\SambaServer;
use Symfony\Component\Security\Core\User\UserInterface;

final class SambaAgentIdentity implements UserInterface
{
    public function __construct(private readonly SambaServer $server)
    {
    }

    public function getServer(): SambaServer
    {
        return $this->server;
    }

    public function getRoles(): array
    {
        return ['ROLE_SAMBA_AGENT'];
    }

    public function eraseCredentials(): void
    {
    }

    public function getUserIdentifier(): string
    {
        return 'samba-agent:'.$this->server->getId();
    }
}

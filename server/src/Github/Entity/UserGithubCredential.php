<?php

namespace Github\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Github\Repository\UserGithubCredentialRepository;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: UserGithubCredentialRepository::class)]
#[ORM\Table(name: 'github_user_credential')]
#[ORM\UniqueConstraint(name: 'uniq_github_user_credential_user', columns: ['user_id'])]
#[ORM\HasLifecycleCallbacks]
class UserGithubCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(name: 'access_token', type: Types::TEXT)]
    private string $accessToken = '';

    #[ORM\Column(name: 'default_owner', length: 255, nullable: true)]
    private ?string $defaultOwner = null;

    #[ORM\Column(name: 'default_repo', length: 255, nullable: true)]
    private ?string $defaultRepo = null;

    #[ORM\Column(name: 'github_login', length: 255, nullable: true)]
    private ?string $githubLogin = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTime();
        if (null === $this->createdAt) {
            $this->createdAt = $now;
        }
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getAccessToken(): string
    {
        return $this->accessToken;
    }

    public function setAccessToken(string $accessToken): self
    {
        $this->accessToken = $accessToken;

        return $this;
    }

    public function getDefaultOwner(): ?string
    {
        return $this->defaultOwner;
    }

    public function setDefaultOwner(?string $defaultOwner): self
    {
        $trimmed = null === $defaultOwner ? '' : trim($defaultOwner);
        $this->defaultOwner = '' === $trimmed ? null : $trimmed;

        return $this;
    }

    public function getDefaultRepo(): ?string
    {
        return $this->defaultRepo;
    }

    public function setDefaultRepo(?string $defaultRepo): self
    {
        $trimmed = null === $defaultRepo ? '' : trim($defaultRepo);
        $this->defaultRepo = '' === $trimmed ? null : $trimmed;

        return $this;
    }

    public function getGithubLogin(): ?string
    {
        return $this->githubLogin;
    }

    public function setGithubLogin(?string $githubLogin): self
    {
        $trimmed = null === $githubLogin ? '' : trim($githubLogin);
        $this->githubLogin = '' === $trimmed ? null : $trimmed;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }
}

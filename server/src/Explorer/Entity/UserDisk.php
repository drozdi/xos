<?php

namespace Explorer\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Explorer\Repository\UserDiskRepository;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: UserDiskRepository::class)]
#[ORM\Table(name: 'explorer_user_disk')]
#[ORM\UniqueConstraint(name: 'uniq_explorer_user_disk_code', columns: ['owner_id', 'code'])]
class UserDisk
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 64)]
    private string $code = '';

    #[ORM\Column(length: 255)]
    private string $label = '';

    #[ORM\Column(length: 32)]
    private string $adapter = 'local';

    #[ORM\Column(type: Types::JSON)]
    private array $config = [];

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(User $owner): self
    {
        $this->owner = $owner;

        return $this;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = strtolower($code);

        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): self
    {
        $this->label = $label;

        return $this;
    }

    public function getAdapter(): string
    {
        return $this->adapter;
    }

    public function setAdapter(string $adapter): self
    {
        $this->adapter = $adapter;

        return $this;
    }

    public function getConfig(): array
    {
        return $this->config;
    }

    public function setConfig(array $config): self
    {
        $this->config = $config;

        return $this;
    }

    public function getSort(): int
    {
        return $this->sort;
    }

    public function setSort(int $sort): self
    {
        $this->sort = $sort;

        return $this;
    }
}

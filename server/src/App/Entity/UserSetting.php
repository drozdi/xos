<?php

namespace App\Entity;

use App\Repository\UserSettingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: UserSettingRepository::class)]
#[ORM\Table(name: 'user_settings')]
#[ORM\UniqueConstraint(name: 'uniq_user_category_key', columns: ['user_id', 'category', 'setting_key'])]
#[ORM\Index(name: 'idx_user_category', columns: ['user_id', 'category'])]
class UserSetting
{
    public const CATEGORY_USER = 'USER';
    public const CATEGORY_APP = 'APP';
    public const CATEGORY_WIN = 'WIN';
    public const CATEGORY_HKEY_CONFIG = 'HKEY_CONFIG';

    public const CATEGORIES = [
        self::CATEGORY_USER,
        self::CATEGORY_APP,
        self::CATEGORY_WIN,
        self::CATEGORY_HKEY_CONFIG,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 32)]
    private string $category;

    #[ORM\Column(name: 'setting_key', length: 512)]
    private string $key;

    #[ORM\Column(type: Types::JSON)]
    private mixed $value = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function setKey(string $key): static
    {
        $this->key = $key;

        return $this;
    }

    public function getValue(): mixed
    {
        return $this->value;
    }

    public function setValue(mixed $value): static
    {
        $this->value = $value;

        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}

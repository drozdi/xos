<?php

namespace Main\Entity;

use Main\Repository\ClaimantRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ClaimantRepository::class)]
#[ORM\Table(name: 'main_claimant')]
class Claimant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 191, unique: true)]
    private ?string $code = null;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(name: 'access_options', type: Types::JSON, options: ['default' => '{}'])]
    private array $accessOptions = [];

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function getAccessOptions(): array
    {
        return $this->accessOptions;
    }

    /**
     * @param array<string, mixed> $accessOptions
     */
    public function setAccessOptions(array $accessOptions): self
    {
        $this->accessOptions = $accessOptions;

        return $this;
    }

    public function __toString(): string {
        return sprintf("%s (%s)", $this->name, $this->code);
    }
}

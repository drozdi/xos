<?php

namespace Main\Entity;

use Main\Repository\OURepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: OURepository::class)]
#[ORM\Table(name: 'main_ou')]
#[ORM\HasLifecycleCallbacks]
class OU {
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(length: 191, unique: true)]
    #[Assert\NotBlank(
        message: 'Code должен быть указан'
    )]
    private ?string $code = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(
        message: 'Название должно быть указано'
    )]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $isTutors = false;

    #[ORM\Column(type: Types::INTEGER, options: ["default" => 100])]
    private ?int $sort = 100;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null
    {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }

    public function setXTimestamp(\DateTimeInterface $xTimestamp): self
    {
        $this->xTimestamp = $xTimestamp;

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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function isIsTutors(): ?bool
    {
        return $this->isTutors;
    }

    public function setIsTutors(bool $isTutors): self
    {
        $this->isTutors = $isTutors;

        return $this;
    }

    public function getSort(): ?int
    {
        return $this->sort;
    }

    public function setSort(int $sort): self
    {
        $this->sort = $sort;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function __toString(): string {
        return sprintf("%s (%s)", $this->name, $this->code);
    }

    public function prePersist (): void {
        $this->xTimestamp = new \DateTime();
    }

    public function preUpdate (): void {
        $this->xTimestamp = new \DateTime();
    }
}

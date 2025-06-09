<?php

namespace Main\Entity;

use Main\Repository\StoredAuthRepository;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: StoredAuthRepository::class)]
#[ORM\Table(name: "main_stored_auth")]
class StoredAuth
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "date_reg", type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $dateReg = null;

    #[ORM\Column(name: "last_auth", type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $lastAuth = null;

    #[ORM\Column(name: "stored_hash", length: 32)]
    private ?string $storedHash = null;

    #[ORM\Column(name: "temp_hash", type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $tempHash = true;

    #[ORM\Column(name: "ip_addr", type: Types::BOOLEAN)]
    private ?int $ipAddr = null;

    /*#[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'storedAuths')]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: "id", nullable: false, onDelete: "CASCADE")]
    private ?User $user = null;*/

    public function __construct()
    {
        $this->dateReg = new \DateTime;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDateReg(): ?\DateTimeInterface
    {
        return $this->dateReg;
    }

    public function setDateReg(\DateTimeInterface $dateReg): self
    {
        $this->dateReg = $dateReg;

        return $this;
    }

    public function getLastAuth(): ?\DateTimeInterface
    {
        return $this->lastAuth;
    }

    public function setLastAuth(\DateTimeInterface $lastAuth): self
    {
        $this->lastAuth = $lastAuth;

        return $this;
    }

    public function getStoredHash(): ?string
    {
        return $this->storedHash;
    }

    public function setStoredHash(string $storedHash): self
    {
        $this->storedHash = $storedHash;

        return $this;
    }

    public function isTempHash(): ?bool
    {
        return $this->tempHash;
    }

    public function setTempHash(bool $tempHash): self
    {
        $this->tempHash = $tempHash;

        return $this;
    }

    public function getIpAddr(): ?int
    {
        return $this->ipAddr;
    }

    public function setIpAddr(int $ipAddr): self
    {
        $this->ipAddr = $ipAddr;

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
}

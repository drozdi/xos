<?php

namespace Pkb\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Pkb\Repository\NoteIndexRepository;

#[ORM\Entity(repositoryClass: NoteIndexRepository::class)]
#[ORM\Table(name: 'pkb_note_index')]
#[ORM\UniqueConstraint(name: 'UNIQ_pkb_note_vault_path', columns: ['vault_id', 'path'])]
#[ORM\Index(name: 'IDX_pkb_note_vault_title', columns: ['vault_id', 'title'])]
class NoteIndex
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vault::class)]
    #[ORM\JoinColumn(name: 'vault_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Vault $vault = null;

    #[ORM\Column(length: 512)]
    private string $path = '';

    #[ORM\Column(length: 255)]
    private string $title = '';

    /** @var list<string> */
    #[ORM\Column(type: Types::JSON)]
    private array $tags = [];

    #[ORM\Column(name: 'outbound_count', type: Types::INTEGER, options: ['default' => 0])]
    private int $outboundCount = 0;

    #[ORM\Column(name: 'inbound_count', type: Types::INTEGER, options: ['default' => 0])]
    private int $inboundCount = 0;

    #[ORM\Column(name: 'content_hash', length: 64)]
    private string $contentHash = '';

    #[ORM\Column(name: 'body_excerpt', length: 500, nullable: true)]
    private ?string $bodyExcerpt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $mtime = null;

    #[ORM\Column(name: 'indexed_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $indexedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getVault(): ?Vault
    {
        return $this->vault;
    }

    public function setVault(?Vault $vault): self
    {
        $this->vault = $vault;

        return $this;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function setPath(string $path): self
    {
        $this->path = $path;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    /** @return list<string> */
    public function getTags(): array
    {
        return $this->tags;
    }

    /** @param list<string> $tags */
    public function setTags(array $tags): self
    {
        $this->tags = $tags;

        return $this;
    }

    public function getOutboundCount(): int
    {
        return $this->outboundCount;
    }

    public function setOutboundCount(int $outboundCount): self
    {
        $this->outboundCount = $outboundCount;

        return $this;
    }

    public function getInboundCount(): int
    {
        return $this->inboundCount;
    }

    public function setInboundCount(int $inboundCount): self
    {
        $this->inboundCount = $inboundCount;

        return $this;
    }

    public function getContentHash(): string
    {
        return $this->contentHash;
    }

    public function setContentHash(string $contentHash): self
    {
        $this->contentHash = $contentHash;

        return $this;
    }

    public function getBodyExcerpt(): ?string
    {
        return $this->bodyExcerpt;
    }

    public function setBodyExcerpt(?string $bodyExcerpt): self
    {
        $this->bodyExcerpt = $bodyExcerpt;

        return $this;
    }

    public function getMtime(): ?\DateTimeInterface
    {
        return $this->mtime;
    }

    public function setMtime(?\DateTimeInterface $mtime): self
    {
        $this->mtime = $mtime;

        return $this;
    }

    public function getIndexedAt(): ?\DateTimeInterface
    {
        return $this->indexedAt;
    }

    public function setIndexedAt(?\DateTimeInterface $indexedAt): self
    {
        $this->indexedAt = $indexedAt;

        return $this;
    }
}

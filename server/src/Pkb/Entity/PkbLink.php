<?php

namespace Pkb\Entity;

use Doctrine\ORM\Mapping as ORM;
use Pkb\Repository\PkbLinkRepository;

#[ORM\Entity(repositoryClass: PkbLinkRepository::class)]
#[ORM\Table(name: 'pkb_link')]
#[ORM\Index(name: 'IDX_pkb_link_target', columns: ['vault_id', 'target_key'])]
#[ORM\Index(name: 'IDX_pkb_link_source', columns: ['vault_id', 'source_path'])]
class PkbLink
{
    public const TYPE_WIKILINK = 'wikilink';
    public const TYPE_EMBED = 'embed';
    public const TYPE_TAG = 'tag';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vault::class)]
    #[ORM\JoinColumn(name: 'vault_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Vault $vault = null;

    #[ORM\Column(name: 'source_path', length: 512)]
    private string $sourcePath = '';

    #[ORM\Column(name: 'target_key', length: 255)]
    private string $targetKey = '';

    #[ORM\Column(name: 'target_path', length: 512, nullable: true)]
    private ?string $targetPath = null;

    #[ORM\Column(name: 'link_type', length: 16)]
    private string $linkType = self::TYPE_WIKILINK;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $alias = null;

    #[ORM\Column(nullable: true)]
    private ?int $position = null;

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

    public function getSourcePath(): string
    {
        return $this->sourcePath;
    }

    public function setSourcePath(string $sourcePath): self
    {
        $this->sourcePath = $sourcePath;

        return $this;
    }

    public function getTargetKey(): string
    {
        return $this->targetKey;
    }

    public function setTargetKey(string $targetKey): self
    {
        $this->targetKey = $targetKey;

        return $this;
    }

    public function getTargetPath(): ?string
    {
        return $this->targetPath;
    }

    public function setTargetPath(?string $targetPath): self
    {
        $this->targetPath = $targetPath;

        return $this;
    }

    public function getLinkType(): string
    {
        return $this->linkType;
    }

    public function setLinkType(string $linkType): self
    {
        $this->linkType = $linkType;

        return $this;
    }

    public function getAlias(): ?string
    {
        return $this->alias;
    }

    public function setAlias(?string $alias): self
    {
        $this->alias = $alias;

        return $this;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(?int $position): self
    {
        $this->position = $position;

        return $this;
    }
}

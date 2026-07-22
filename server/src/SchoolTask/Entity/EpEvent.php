<?php

namespace SchoolTask\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\File;
use Main\Entity\Group;
use Main\Entity\User;
use SchoolTask\Repository\EpEventRepository;

#[ORM\Entity(repositoryClass: EpEventRepository::class)]
#[ORM\Table(name: 'st_ep_event')]
class EpEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Group::class)]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?Group $group = null;

    #[ORM\ManyToOne(targetEntity: Group::class)]
    #[ORM\JoinColumn(name: 'class_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?Group $class = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $title = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $start;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $end;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $theme = null;

    #[ORM\Column(name: 'net_resource', type: Types::TEXT, nullable: true)]
    private ?string $netResource = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $pt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $ht = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'zoom_link', type: Types::TEXT, nullable: true)]
    private ?string $zoomLink = null;

    #[ORM\Column(name: 'zoom_in', type: Types::TEXT, nullable: true)]
    private ?string $zoomIn = null;

    #[ORM\Column(name: 'zoom_pas', type: Types::TEXT, nullable: true)]
    private ?string $zoomPas = null;

    #[ORM\Column(name: '`update`', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $update = false;

    #[ORM\ManyToMany(targetEntity: File::class)]
    #[ORM\JoinTable(name: 'st_ep_event_file')]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'file_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $files;

    public function __construct()
    {
        $this->children = new ArrayCollection();
        $this->files = new ArrayCollection();
        $this->start = new \DateTime();
        $this->end = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }

        return $this->xTimestamp;
    }

    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self
    {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): self
    {
        $this->parent = $parent;

        return $this;
    }

    /** @return Collection<int, self> */
    public function getChildren(): Collection
    {
        return $this->children;
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

    public function getGroup(): ?Group
    {
        return $this->group;
    }

    public function setGroup(?Group $group): self
    {
        $this->group = $group;

        return $this;
    }

    public function getClass(): ?Group
    {
        return $this->class;
    }

    public function setClass(?Group $class): self
    {
        $this->class = $class;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getStart(?string $format = null): \DateTimeInterface|string
    {
        if (null !== $format) {
            return $this->start->format($format);
        }

        return $this->start;
    }

    public function setStart(\DateTimeInterface $start): self
    {
        $this->start = $start;

        return $this;
    }

    public function getEnd(?string $format = null): \DateTimeInterface|string
    {
        if (null !== $format) {
            return $this->end->format($format);
        }

        return $this->end;
    }

    public function setEnd(\DateTimeInterface $end): self
    {
        $this->end = $end;

        return $this;
    }

    public function getTheme(): ?string
    {
        return $this->theme;
    }

    public function setTheme(?string $theme): self
    {
        $this->theme = $theme;

        return $this;
    }

    public function getNetResource(): ?string
    {
        return $this->netResource;
    }

    public function setNetResource(?string $netResource): self
    {
        $this->netResource = $netResource;

        return $this;
    }

    public function getPt(): ?string
    {
        return $this->pt;
    }

    public function setPt(?string $pt): self
    {
        $this->pt = $pt;

        return $this;
    }

    public function getHt(): ?string
    {
        return $this->ht;
    }

    public function setHt(?string $ht): self
    {
        $this->ht = $ht;

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

    public function getZoomLink(): ?string
    {
        return $this->zoomLink;
    }

    public function setZoomLink(?string $zoomLink): self
    {
        $this->zoomLink = $zoomLink;

        return $this;
    }

    public function getZoomIn(): ?string
    {
        return $this->zoomIn;
    }

    public function setZoomIn(?string $zoomIn): self
    {
        $this->zoomIn = $zoomIn;

        return $this;
    }

    public function getZoomPas(): ?string
    {
        return $this->zoomPas;
    }

    public function setZoomPas(?string $zoomPas): self
    {
        $this->zoomPas = $zoomPas;

        return $this;
    }

    public function isUpdate(): bool
    {
        return $this->update;
    }

    public function setUpdate(bool $update): self
    {
        $this->update = $update;

        return $this;
    }

    /** @return Collection<int, File> */
    public function getFiles(): Collection
    {
        return $this->files;
    }

    public function addFile(File $file): self
    {
        if (!$this->files->contains($file)) {
            $this->files->add($file);
        }

        return $this;
    }

    public function removeFile(File $file): self
    {
        $this->files->removeElement($file);

        return $this;
    }
}

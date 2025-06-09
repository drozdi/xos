<?php

namespace Device\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;

use Device\Entity\License\Software as LicenseSoftware;
use Device\Repository\LicenseRepository;

#[ORM\Table(name: 'd_license')]
#[ORM\Entity(repositoryClass: LicenseRepository::class)]
#[ORM\HasLifecycleCallbacks]
class License {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * One License have Many Software.
     * @var Collection<int, LicenseSoftware>
     */
    #[ORM\OneToMany(mappedBy: 'license', targetEntity: LicenseSoftware::class)]
    private Collection $softwares;

    #[ORM\Column(name: 'code', length: 191, unique: true)]
    private string $code;

    #[ORM\Column(name: 'type', length: 255)]
    private string $type;

    #[ORM\Column(name: 'aut_no', length: 255)]
    private string $autNo;

    #[ORM\Column(name: 'no', length: 255)]
    private string $no;

    #[ORM\Column(name: 'date_real', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateReal;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    public function __construct () {
        $this->softwares = new ArrayCollection();
    }

    public function getId (): ?int {
        return $this->id;
    }


    public function newSoftware (Software $software): LicenseSoftware {
        $licenseSoftware = new LicenseSoftware;
        $this->addSoftware($licenseSoftware);
        $licenseSoftware->setSoftware($software);
        return $licenseSoftware;
    }

    public function addSoftware (LicenseSoftware $software): self {
        if (!$this->softwares->contains($software)) {
            $this->softwares->add($software);
            $software->setLicense($this);
        }

        return $this;
    }

    public function removeSoftware(LicenseSoftware $software): self {
        if ($this->softwares->removeElement($software)) {
            $software->setLicense(null);
        }
        return $this;
    }

    /**
     * Get softwares
     *
     * @return Collection<int, LicenseSoftware>
     */
    public function getSoftwares (): Collection {
        return $this->softwares;
    }


    public function getCode(): string {
        return $this->code;
    }
    public function setCode ($code): self {
        $this->code = $code;

        return $this;
    }

    public function getSort (): int{
        return $this->sort;
    }
    public function setSort (int $sort): self {
        $this->sort = $sort;
        return $this;
    }

    public function getType (): string {
        return $this->type;
    }
    public function setType (string $type): self {
        $this->type = $type;

        return $this;
    }

    public function getAutNo (): string {
        return $this->autNo;
    }
    public function setAutNo (string $autNo): self {
        $this->autNo = $autNo;

        return $this;
    }

    public function getNo (): string {
        return $this->no;
    }
    public function setNo (string $no): self {
        $this->no = $no;

        return $this;
    }

    public function getDateReal (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->dateReal) {
            return $this->dateReal->format($format);
        }
        return $this->dateReal;
    }
    public function setDateReal (?\DateTimeInterface $dateReal = null): self {
        $this->dateReal = $dateReal;

        return $this;
    }

    #[ORM\PrePersist]
    public function prePersist (): void {

    }
    #[ORM\PreUpdate]
    public function preUpdate (): void {

    }
    #[ORM\PreFlush]
    public function preFlush (): void {

    }
    #[ORM\PreRemove]
    public function preRemove (): void {

    }
}


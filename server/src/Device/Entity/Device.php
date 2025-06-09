<?php

namespace Device\Entity;

use Main\Entity\User;
use Main\Entity\File;
use Device\Repository\DeviceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\ORM\Event\PreFlushEventArgs ;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[ORM\Table(name: 'd_device')]
#[ORM\Entity(repositoryClass: DeviceRepository::class)]
#[ORM\UniqueConstraint(columns: ["group_id", "code"])]
#[ORM\UniqueConstraint(columns: ["type_id", "sn"])]
#[ORM\HasLifecycleCallbacks]
class Device {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: "date_created", type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreated = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    /**
     * One Device have Many Devices.
     * @var Collection<int, Device>
     */
    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    #[ORM\OrderBy(['sort' => "ASC", 'name' => "ASC"])]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: "RESTRICT")]
    private ?Type $type = null;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?Type $group = null;

    #[ORM\OneToOne(targetEntity: Accounting::class, inversedBy: "device")]
    #[ORM\JoinColumn(name: 'accounting_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private ?Accounting $accounting = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "created_by", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "modified_by", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $modifiedBy = null;

    #[ORM\Column(name: "code", length: 191)]
    private string $code = '';

    #[ORM\Column(name: "name", length: 255, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(name: "sn", length: 191, nullable: true)]
    private ?string $sn = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'log', type: Types::TEXT, nullable: true)]
    private ?string $log = null;

    /**
     * One Device have Many Device\History.
     * @var Collection<int, Device\History>
     */
    #[ORM\OneToMany(mappedBy: 'device', targetEntity: Device\History::class)]
    #[ORM\OrderBy(['datePlacement' => "ASC"])]
    private Collection $histories;

    /**
     * One Device have Many Device\Repair.
     * @var Collection<int, Device\Repair>
     */
    #[ORM\OneToMany(mappedBy: 'device', targetEntity: Device\Repair::class)]
    #[ORM\OrderBy(['putInto' => "ASC"])]
    private Collection $repairs;

    /**
     * One Device have Many Device\Location.
     * @var Collection<int, Device\Location>
     */
    #[ORM\OneToMany(mappedBy: 'device', targetEntity: Device\Location::class)]
    #[ORM\OrderBy(['date' => "ASC"])]
    private Collection $locations;

    /**
     * One Device have Many Device\License.
     * @var Collection<int, Device\License>
     */
    #[ORM\OneToMany(mappedBy: 'device', targetEntity: Device\License::class)]
    private Collection $licenses;

    /**
     * One Device have Many Device\Property.
     * @var Collection<int, Device\Property>
     */
    #[ORM\OneToMany(mappedBy: 'device', targetEntity: Device\Property::class)]
    private Collection $properties;


    /*
     * @var \App\Controller\File
     *
     * @ORM\OneToOne(targetEntity="App\Controller\File")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="file_id", referencedColumnName="id", unique=true, nullable=true, onDelete="RESTRICT")
     * })
     * @ORM\JoinTable(name="App\Controller\File",
     *   joinColumns={
     *     @ORM\JoinColumn(name="file_id", referencedColumnName="id", unique=true, nullable=true, onDelete="RESTRICT")
     *   }
     * )
     */
    //private $file;

    #[ORM\JoinTable(name: 'd_device_image')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    #[ORM\InverseJoinColumn(name: 'file_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    #[ORM\ManyToMany(targetEntity: File::class)]
    #[ORM\OrderBy(["dateUpload" => "ASC"])]
    private Collection $images;

    public function __construct() {
        $this->children = new ArrayCollection();
        $this->properties = new ArrayCollection();
        $this->locations = new ArrayCollection();
        $this->histories = new ArrayCollection();
        $this->repairs = new ArrayCollection();
        $this->licenses = new ArrayCollection();
        $this->images = new ArrayCollection();
    }

    public function getId (): ?int {
        return $this->id;
    }

    public function getXTimestamp (?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp (\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getDateCreated (?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->dateCreated) {
            return $this->dateCreated->format($format);
        }
        return $this->dateCreated;
    }
    public function setDateCreated(\DateTimeInterface $dateCreated): self {
        $this->dateCreated = $dateCreated;

        return $this;
    }

    public function getParent (): ?self {
        return $this->parent;
    }
    public function setParent (?Device $parent = null): self {
        if ($this->parent && ($this->parent != $parent)) {
            $this->parent->removeChild($this);
        }

        $this->parent = $parent;

        if ($this->parent) {
            $this->parent->addChild($this);
        }

        return $this;
    }

    public function addChild (self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }

        return $this;
    }
    public function removeChild(self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }
        foreach ($this->properties as $property) {
            if ($property->getSubDevice() === $child) {
                $this->removeProperty($property);
            }
        }
        return $this;
    }
    /**
     * Get children
     *
     * @return Collection<int, self>
     */
    public function getChildren (): Collection {
        return $this->children;
    }


    public function getType (): ?Type {
        return $this->type;
    }
    public function setType (?Type $type = null): self {
        $this->type = $type;

        if (null != $this->type) {
            $this->setGroup($this->type->getParent());
        } else {
            $this->setGroup(null);
        }

        return $this;
    }

    public function getGroup (): ?Type {
        return $this->group;
    }
    public function setGroup (?Type $type = null): self {
        $this->group = $type;

        return $this;
    }

    public function getAccounting (): ?Accounting {
        return $this->accounting;
    }
    public function setAccounting (?Accounting $accounting = null): self {
        if ($this->accounting && ($this->accounting != $accounting)) {
            $this->accounting->setDevice(null);
        }

        $this->accounting = $accounting;

        if ($this->accounting && $this->accounting->getDevice() != $this) {
            $this->accounting->setDevice($this);
        }

        return $this;
    }

    public function getCreatedBy(): ?User {
        return $this->createdBy;
    }
    public function setCreatedBy(?User $createdBy = null): self {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getModifiedBy (): ?User {
        return $this->modifiedBy;
    }
    public function setModifiedBy (?User $modifiedBy = null): self {
        $this->modifiedBy = $modifiedBy;

        return $this;
    }

    public function getCode (bool $autoPrefix = true): string {
        if ($autoPrefix && $this->type) {
            return $this->type->getPrefix().$this->code;
        }

        return $this->code;
    }
    public function setCode (string $code): self {
        $this->code = $code;

        return $this;
    }

    public function getName (): ?string {
        return $this->name;
    }
    public function setName (?string $name = null): self {
        $this->name = $name;

        return $this;
    }

    public function getSn(): ?string {
        return $this->sn;
    }
    public function setSn (?string $sn = null): self {
        $this->sn = $sn;

        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort (int $sort): self {
        $this->sort = $sort;

        return $this;
    }

    public function getDescription (): ?string {
        return $this->description;
    }
    public function setDescription (?string $description = null): self {
        $this->description = $description;

        return $this;
    }

    public function getLog (): ?string {
        return $this->log;
    }
    public function setLog (?string $log = null): self {
        $this->log = $log;

        return $this;
    }
    public function addLog (string $mes): self {
        $this->log = $this->log.(new \DateTime)->format("Y.m.d H:i").": ".$mes."\n";

        return $this;
    }

    public function newHistory (Device $device): Device\History {
        $history = new Device\History;

        $history
            ->setDevice($this)
            ->setParent($device);

        $this->addHistory($history);

        return $history;
    }
    public function addHistory (Device\History $history): self {
        if (!$this->histories->contains($history)) {
            $this->histories->add($history);
            $history->setDevice($this);
        }

        return $this;
    }
    public function removeHistory (Device\History $history) {
        if ($this->histories->removeElement($history)) {
            $history->setDevice(null);
        }

        return $this;
    }
    /**
     * Get histories
     *
     * @return Collection<int, Device\History>
     */
    public function getHistories (): Collection {
        return $this->histories;
    }

    public function newRepair (): Device\Repair {
        $repair = new Device\Repair;

        $this->addRepair($repair);

        return $repair;
    }
    public function addRepair (Device\Repair $repair): self {
        if (!$this->repairs->contains($repair)) {
            $this->repairs->add($repair);
            $repair->setDevice($this);
        }

        return $this;
    }
    public function removeRepair (Device\Repair $repair): self {
        if ($this->repairs->removeElement($repair)) {
            $repair->setDevice(null);
        }

        return $this;
    }
    /**
     * Get repairs
     *
     * @return Collection<int, Device\Repair>
     */
    public function getRepairs (): Collection {
        return $this->repairs;
    }

    public function newLocation (): Device\Location {
        $location = new Device\Location;

        $this->addLocation($location);

        return $location;
    }
    public function addLocation (Device\Location $location): self {
        if (!$this->locations->contains($location)) {
            $this->locations->add($location);
            $location->setDevice($this);
        }

        return $this;
    }
    public function removeLocation (Device\Location $location): self {
        if ($this->locations->removeElement($location)) {
            $location->setDevice(null);
        }

        return $this;
    }
    /**
     * Get locations
     *
     * @return Collection<int, Device\Location>
     */
    public function getLocations () {
        return $this->locations;
    }

    public function newLicense (License\Software $licenseSoftware): Device\License {
        $license = new Device\License;

        $license->setLicenseSoftware($licenseSoftware);

        $this->addLicense($license);

        return $license;
    }
    public function addLicense (Device\License $license): self {
        if (!$this->licenses->contains($license)) {
            $this->licenses->add($license);
            $license->setDevice($this);
        }

        return $this;
    }
    public function removeLicense (Device\License $license): self {
        if ($this->licenses->removeElement($license)) {
            $license->setDevice(null);
        }

        return $this;
    }
    /**
     * Get licenses
     *
     * @return Collection<int, Device\License>
     */
    public function getLicenses (): Collection {
        return $this->licenses;
    }

    public function newProperty (Property $property = null): Device\Property {
        $prop = new Device\Property;

        $prop->setProperty($property);

        $this->addProperty($prop);

        return $prop;
    }
    public function addProperty (Device\Property $property): self {
        if (!$this->properties->contains($property)) {
            $this->properties->add($property);
            $property->setDevice($this);
        }

        return $this;
    }
    public function removeProperty (Device\Property $property): self {
        if ($this->properties->removeElement($property)) {
            $property->setDevice(null);
        }

        return $this;
    }
    /**
     * Get properties
     *
     * @return Collection<int, Device\Property>
     */
    public function getProperties (): Collection {
        return $this->properties;
    }

    public function addImage (File $file): self {
        if (!$this->images->contains($file)) {
            $this->images->add($file);
        }

        return $this;
    }
    public function removeImage (File $file): self {
        $this->images->removeElement($file);

        return $this;
    }
    /**
     * Get images
     *
     * @return Collection<int, File>
     */
    public function getImages (): Collection {
        return $this->images;
    }

    /*public function getFile () {
        return $this->file;
    }
    public function setFile (\App\Controller\File $file = null) {
        $this->file = $file;

        return $this;
    }*/



    #[ORM\PrePersist]
    public function prePersist (): void {
        $this->setDateCreated(new \DateTime());
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

<?php


namespace Main\Entity;
use Doctrine\DBAL\Types\Types;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;


#[ORM\Entity]
#[ORM\Table(name: 'main_file')]
#[ORM\HasLifecycleCallbacks]
class File
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "created_by", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "modified_by", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $modifiedBy = null;

    #[ORM\Column(name: 'date_upload', type: Types::DATETIME_MUTABLE, nullable: false)]
    private \DateTimeInterface $dateUpload;

    #[ORM\Column(name: 'module', length: 255)]
    private string $module = '';

    #[ORM\Column(name: 'width', type: Types::INTEGER, options: ["default" => 0])]
    private int $width = 0;

    #[ORM\Column(name: 'height', type: Types::INTEGER, options: ["default" => 0])]
    private int $height = 0;

    #[ORM\Column(name: 'file_size', type: Types::INTEGER, columnDefinition: "int(18) NOT NULL")]
    private int $fileSize = 0;

    #[ORM\Column(name: 'content_type', length: 255)]
    private string $contentType = '';

    #[ORM\Column(name: 'sub_dir', length: 255)]
    private string $subDir = '';

    #[ORM\Column(name: 'file_name', length: 255)]
    private string $fileName = '';

    #[ORM\Column(name: 'original_name', length: 255)]
    private string $originalName = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'external_id', length: 191, unique: true, nullable: true)]
    private ?string $externalId = null;

    /**
     * File constructor.
     */
    public function __construct () {
        $this->dateUpload = new \DateTime;
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
    public function setXTimestamp (?\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }

    public function getCreatedBy (): ?User {
        return $this->createdBy;
    }
    public function setCreatedBy (?User $createdBy = null): self {
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

    public function getDateUpload (string $format = null): \DateTimeInterface|string {
        if (null != $format && null != $this->dateUpload) {
            return $this->dateUpload->format($format);
        }
        return $this->dateUpload;
    }
    public function setDateUpload (\DateTimeInterface $dateRegister): self {
        $this->dateUpload = $dateRegister;

        return $this;
    }

    public function setModule (string $module): self{
        $this->module = $module;

        return $this;
    }

    public function getModule (): string {
        return $this->module;
    }

    public function setWidth (int $width): self{
        $this->width = $width;

        return $this;
    }
    public function getWidth (): int {
        return $this->width;
    }

    public function setHeight (int $height): self {
        $this->height = $height;

        return $this;
    }
    public function getHeight (): int {
        return $this->height;
    }

    public function setFileSize (int $fileSize): self {
        $this->fileSize = $fileSize;

        return $this;
    }
    public function getFileSize (): int {
        return $this->fileSize;
    }

    public function setContentType (string $contentType): self {
        $this->contentType = $contentType;

        return $this;
    }
    public function getContentType (): string {
        return $this->contentType;
    }

    public function setSubDir (string $subDir): self {
        $this->subDir = $subDir;

        return $this;
    }
    public function getSubDir (): string {
        return $this->subDir;
    }

    public function setFileName (string $fileName): self {
        $this->fileName = $fileName;

        return $this;
    }
    public function getFileName (): string {
        return $this->fileName;
    }

    public function setOriginalName (string $originalName): self {
        $this->originalName = $originalName;

        return $this;
    }
    public function getOriginalName (): string {
        return $this->originalName;
    }

    public function setDescription (?string $description = null): self {
        $this->description = $description;

        return $this;
    }
    public function getDescription (): ?string{
        return $this->description;
    }

    public function setExternalId (?string $externalId = null): self {
        $this->externalId = $externalId;

        return $this;
    }
    public function getExternalId (): ?string {
        return $this->externalId;
    }

    public function getFileSRC (): string {
        return '/uploads/'.$this->module.'/'.$this->subDir.'/'.$this->fileName;
    }

    public function prePersist (User $user): void {
        $this->setXTimestamp(new \DateTime());
        $this->setCreatedBy($user);
        $this->setModifiedBy($user);
    }
    public function preUpdate (User $user): void {
        $this->setXTimestamp(new \DateTime());
        $this->setModifiedBy($user);
    }
}
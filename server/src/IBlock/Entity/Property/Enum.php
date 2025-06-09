<?php

namespace App\Entity\iBlock\Property;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

use App\Entity\iBlock\Property;

#[ORM\Table(name: 'iblock_property_enum')]
#[ORM\UniqueConstraint(columns: ["property_id", "value"])]
#[ORM\HasLifecycleCallbacks]
class Enum {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private $id;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: Property::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private ?Property $property = null;

    #[ORM\Column(name: 'name', length: 255)]
    private ?string $name = null;

    #[ORM\Column(name: "code", length: 191)]
    private ?string $code = null;

    #[ORM\Column(name: '`default`', type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $default = false;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private $sort = 100;


    public function getId (): ?int {
        return $this->id;
    }

    public function getXTimestamp(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }

    public function getProperty (): ?Property {
        return $this->property;
    }
    public function setProperty (Property $property = null): self {
        if ($this->property && $this->property != $property) {
            $this->property->removeEnum($this);
        }
        $this->property = $property;
        if ($this->property) {
            $this->property->addEnum($this);
        }
        return $this;
    }


    public function isDefault (): bool {
        return $this->default;
    }
    public function setDefault (bool $default): self {
        $this->default = $default;
        return $this;
    }

    public function getCode (): string {
        return $this->code;
    }
    public function setCode (string $code): self {
        $this->code = $code;
        return $this;
    }

    public function getName (): string {
        return $this->name;
    }
    public function setName (string $name): self {
        $this->name = $name;
        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort ($sort): self {
        $this->sort = $sort;
        return $this;
    }



    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();
        $this->xTimestamp = new \DateTime();
        if (null == $this->name) {
            $errors[] = 'Не ввели название!';
        }
        if (null == $this->code) {
            $errors[] = 'Не ввели код!';
        }
        $criteria = new Criteria();
        $criteria
            ->where(Criteria::expr()->neq('id', $this->id))
            ->andWhere(Criteria::expr()->eq('code', $this->code))
            ->andWhere(Criteria::expr()->eq('property', $this->property));
        if ($event->getEntityManager()->getRepository(Enum::class)->matching($criteria)->count() > 0) {
            $errors[] = 'Такой код уже используется!';
        }
        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }


    public function preRemove () {

    }

    public function prePersist(): void {
        $this->xTimestamp = new \DateTime();
    }
}


<?php

namespace Device\Entity;

use Device\Entity\Software\Type;
use Device\Repository\SoftwareRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Table(name: 'd_software')]
#[ORM\Entity(repositoryClass: SoftwareRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Software {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    /**
     * One Type have Many Types.
     * @var Collection<int, self>
     */
    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    #[ORM\OrderBy(['sort' => "ASC", 'name' => "ASC"])]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: false, onDelete: "RESTRICT")]
    #[Assert\NotBlank(
        message: 'Тип должен быть указан'
    )]
    private Type $type;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank(
        message: 'Нозвание должно быть указано'
    )]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    public function __construct () {
        $this->children = new ArrayCollection();
    }

    public function getId (): ?int {
        return $this->id;
    }

    public function getParent (): ?self {
        return $this->parent;
    }
    public function setParent (?self $parent = null): self {
        if ($this->parent && ($parent != $this->parent)) {
            $this->parent->removeChild($this);
        }

        $this->parent = $parent;

        if ($this->parent) {
            $this->parent->addChild($this);
            $this->setType($this->parent->getType());
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
    public function removeChild (self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
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
        return $this->type ?? null;
    }
    public function setType (Type $type): self {
        $this->type = $type;

        foreach ($this->children as $child) {
            $child->setType($type);
        }

        return $this;
    }

    public function getName (): ?string {
        return $this->name;
    }
    public function setName (?string $name = null): self {
        $this->name = $name;

        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort (int $sort): self {
        $this->sort = $sort;

        return $this;
    }

    public function isRoot (): bool {
        return null == $this->parent && $this->children->count() > 0;
    }
    public function isChild ():bool {
        return null != $this->parent;
    }

    #[ORM\PrePersist]
    public function prePersist (): void {

    }
    public function preUpdate(PreUpdateEventArgs $event): void {
        $errors = array();

        if (null == $this->name) {
            $errors[] = 'Не вели название!';
        }
        if (null == $this->type) {
            $errors[] = 'Не выбрали тип программы!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
    #[ORM\PreFlush]
    public function preFlush (): void {

    }
    #[ORM\PreRemove]
    public function preRemove (PreRemoveEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('App\Entity\Device\License')->count(array(
                'software' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName().'", пока она установлена!';
        }

        if ((int)$event->getEntityManager()->getRepository('App\Entity\License\Software')->count(array(
                'software' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName().'", пока она привязана к лицензии!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


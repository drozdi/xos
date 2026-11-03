<?php

namespace Device\Entity;

use Device\Entity\Software\Type;
use Device\Repository\SoftwareRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Persistence\Event\LifecycleEventArgs;

#[ORM\Table(name: 'd_software')]
#[ORM\Entity(repositoryClass: SoftwareRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Software
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToMany(targetEntity: Software::class, mappedBy: 'parent')]
    #[ORM\OrderBy(['sort' => 'ASC', 'name' => 'ASC'])]
    private $children;

    #[ORM\ManyToOne(targetEntity: Software::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private $parent;

    #[ORM\Column(name: 'name', length: 255, nullable: false, unique: true)]
    private $name;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $type;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: true, unique: false, options: ['default' => 100])]
    private $sort = 100;

    /**
     * Get id.
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set parent.
     *
     * @param bool $addChild[true]
     *
     * @return Software
     */
    public function setParent(?Software $parent = null, $addChild = true)
    {
        if ((null === $parent || $this->parent !== $parent) && null !== $this->parent) {
            $this->parent->removeChild($this, false);
        }

        $this->parent = $parent;

        if (null != $this->parent) {
            $this->setType($this->parent->getType());
        }

        if (true === $addChild && null != $this->parent) {
            $this->parent->addChild($this, false);
        }

        return $this;
    }

    /**
     * Get parent.
     *
     * @return Software|null
     */
    public function getParent()
    {
        return $this->parent;
    }

    /**
     * Add child.
     *
     * @param bool $setParent
     *
     * @return Software
     */
    public function addChild(Software $child, $setParent = true)
    {
        if (false === $this->children->indexOf($child)) {
            $this->children[] = $child;
        }

        if (true === $setParent) {
            $child->setParent($this, false);
        }

        return $this;
    }

    /**
     * Remove child.
     *
     * @param bool $removeParent[true]
     *
     * @return Software
     */
    public function removeChild(Software $child, $removeParent = true)
    {
        $this->children->removeElement($child);

        if (true === $removeParent) {
            $child->setParent(null, false);
        }

        return $this;
    }

    /**
     * Get children.
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getChildren()
    {
        return $this->children;
    }

    /**
     * Set name.
     *
     * @param string $name
     *
     * @return Software
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name.
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set sort.
     *
     * @param int $sort
     *
     * @return Software
     */
    public function setSort($sort)
    {
        $this->sort = $sort;

        return $this;
    }

    /**
     * Get code.
     *
     * @return int
     */
    public function getSort()
    {
        return $this->sort;
    }

    /**
     * Set type.
     *
     * @return Software
     */
    public function setType(?Type $type = null)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type.
     *
     * @return Type|null
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Check whether the root software.
     *
     * @return bool
     */
    public function isRoot()
    {
        return null == $this->parent && $this->children->count() > 0;
    }

    /**
     * Is children.
     *
     * @return bool
     */
    public function isChild()
    {
        return null != $this->parent;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
        $errors = [];

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

    #[ORM\PreRemove]
    public function preRemove(LifecycleEventArgs $event)
    {
        $errors = [];

        if ((int) $event->getObjectManager()->getRepository('Device\Entity\Device\License')->count([
            'software' => $this->getId(),
        ]) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName().'", пока она установлена!';
        }

        if ((int) $event->getObjectManager()->getRepository('Device\Entity\License\Software')->count([
            'software' => $this->getId(),
        ]) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName().'", пока она привязана к лицензии!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}

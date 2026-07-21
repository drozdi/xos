<?php

namespace Device\Entity;

use Device\Entity\Software\Type;
use Device\Repository\SoftwareRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

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

    #[ORM\ManyToOne(targetEntity: Software\Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $type;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: true, unique: false, options: ['default' => 100])]
    private $sort = 100;

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set parent
     *
     * @param \Device\Entity\Software $parent
     * @param boolean $addChild[true]
     *
     * @return \Device\Entity\Software
     */
    public function setParent(\Device\Entity\Software $parent = null, $addChild = true)
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
     * Get parent
     *
     * @return \Device\Entity\Software
     */
    public function getParent()
    {
        return $this->parent;
    }

    /**
     * Add child
     *
     * @param \Device\Entity\Software $child
     * @param boolean $setParent[true]
     *
     * @return \Device\Entity\Software
     */
    public function addChild(\Device\Entity\Software $child, $setParent = true)
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
     * Remove child
     *
     * @param \Device\Entity\Software $child
     * @param boolean $removeParent[true]
     *
     * @return \Device\Entity\Software
     */
    public function removeChild(\Device\Entity\Software $child, $removeParent = true)
    {
        $this->children->removeElement($child);

        if (true === $removeParent) {
            $child->setParent(null, false);
        }

        return $this;
    }

    /**
     * Get children
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getChildren()
    {
        return $this->children;
    }

    /**
     * Set name
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
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set sort
     *
     * @param integer $sort
     *
     * @return \Device\Entity\Software
     */
    public function setSort($sort)
    {
        $this->sort = $sort;

        return $this;
    }

    /**
     * Get code
     *
     * @return integer
     */
    public function getSort()
    {
        return $this->sort;
    }

    /**
     * Set type
     *
     * @param \Device\Entity\Software\Type $type
     *
     * @return \Device\Entity\Software
     */
    public function setType(\Device\Entity\Software\Type $type = null)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return \Device\Entity\Software\Type
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Check whether the root software
     *
     * @return boolean
     */
    public function isRoot()
    {
        return null == $this->parent && $this->children->count() > 0;
    }

    /**
     * Is children
     *
     * @return  boolean
     */
    public function isChild ()
    {
        return null != $this->parent;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
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

    #[ORM\PreRemove]
    public function preRemove(LifecycleEventArgs $event)
    {
        $errors = array();

        if ((int)$event->getObjectManager()->getRepository('Device\Entity\Device\License')->count(array(
                'software' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName().'", пока она установлена!';
        }

        if ((int)$event->getObjectManager()->getRepository('Device\Entity\License\Software')->count(array(
                'software' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName().'", пока она привязана к лицензии!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


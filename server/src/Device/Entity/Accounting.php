<?php

namespace Device\Entity;

use Device\Repository\AccountingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_accounting')]
#[ORM\Entity(repositoryClass: AccountingRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Accounting {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToMany(targetEntity: Accounting::class, mappedBy: 'parent')]
    private $children;

    #[ORM\ManyToOne(targetEntity: Accounting::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private $parent;

    #[ORM\OneToOne(targetEntity: Device::class, mappedBy: 'accounting')]
    private $device;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    #[ORM\Version]
    private $xTimestamp;

    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    private $dateCreated;

    #[ORM\Column(name: 'name', type: Types::TEXT, nullable: true, unique: false)]
    private $name;

    #[ORM\Column(name: 'in_no', length: 255, nullable: true, unique: false)]
    private $inNo;

    #[ORM\Column(name: 'invoice', length: 255, nullable: true, unique: false)]
    private $invoice;

    #[ORM\Column(name: 'date_invoice', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $dateInvoice;

    #[ORM\Column(name: 'date_discarded', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $dateDiscarded;

    #[ORM\Column(name: 'discarded', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => false])]
    private $discarded = 0;

    /**
     * Constructor
     */
    public function __construct () {
        $this->children = new \Doctrine\Common\Collections\ArrayCollection();
        $this->setDateCreated(new \DateTime);
        $this->setDateInvoice(new \DateTime);
    }

    /**
     * Get id
     *
     * @return integer
     */
    public function getId () {
        return $this->id;
    }

    /**
     * Add child
     *
     * @param \Device\Entity\Accounting $child
     * @param boolean $setParent[true]
     *
     * @return \Device\Entity\Accounting
     */
    public function addChild (Accounting $child, $setParent = true) {
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
     * @param \Device\Entity\Accounting $child
     * @param boolean $removeParent[true]
     *
     * @return \Device\Entity\Accounting
     */
    public function removeChild (Accounting $child, $removeParent = true) {
        $this->children->removeElement($child);
        if (true === $removeParent) {
            $child->setParent(null, false);
        }
        return $this;
    }

    /**
     * New Child
     *
     * @return \Device\Entity\Accounting
     */
    public function newChild ()  {
        $child = new Accounting;
        $child->setInNo($this->getInNo());
        $child->setName($this->getName());
        $child->setInvoice($this->getInvoice());
        $child->setDiscarded($this->getDiscarded());
        $child->setDateInvoice($this->getDateInvoice());
        $child->setDateDiscarded($this->getDateDiscarded());
        $this->addChild($child);
        return $child;
    }

    /**
     * Get children
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getChildren () {
        return $this->children;
    }

    /**
     * Set parent
     *
     * @param \Device\Entity\Accounting $parent
     * @param boolean $addChild[true]
     *
     * @return \Device\Entity\Accounting
     */
    public function setParent (Accounting $parent = null, $addChild = true) {
        if ((null === $parent || $this->parent !== $parent) && null !== $this->parent) {
            $this->parent->removeChild($this, false);
        }
        $this->parent = $parent;
        if (true === $addChild && null !== $this->parent) {
            $this->parent->addChild($this, false);
        }
        return $this;
    }

    /**
     * Get parent
     *
     * @return \Device\Entity\Accounting
     */
    public function getParent () {
        return $this->parent;
    }

    /**
     * Set device
     *
     * @param \Device\Entity\Device $device
     * @param boolean $setAccounting[true]
     *
     * @return \Device\Entity\Accounting
     */
    public function setDevice (Device $device = null, $setAccounting = true) {
        if ((null === $device || $this->device !== $device) && null !== $this->device) {
            $this->device->setAccounting(null, false);
        }
        $this->device = $device;
        if (true === $setAccounting && null != $this->device) {
            $this->device->setAccounting($this, false);
        }
        return $this;
    }

    /**
     * Get device
     *
     * @return \Device\Entity\Device
     */
    public function getDevice () {
        return $this->device;
    }

    /**
     * Set xTimestamp
     *
     * @param \DateTime $xTimestamp
     *
     * @return \Device\Entity\Accounting
     */
    public function setXTimestamp ($xTimestamp) {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }

    /**
     * Get xTimestamp
     *
     * @return \DateTime
     */
    public function getXTimestamp () {
        return $this->xTimestamp;
    }

    /**
     * Set dateCreated
     *
     * @param \DateTime $dateCreated
     *
     * @return \Device\Entity\Accounting
     */
    public function setDateCreated ($dateCreated) {
        $this->dateCreated = $dateCreated;
        return $this;
    }

    /**
     * Get dateCreated
     *
     * @return \DateTime
     */
    public function getDateCreated () {
        return $this->dateCreated;
    }

    /**
     * Set name
     *
     * @param string $name
     *
     * @return Accounting
     */
    public function setName ($name) {
        $this->name = $name;
        return $this;
    }

    /**
     * Get name
     *
     * @param string $getParent[true]
     *
     * @return string
     */
    public function getName ($getParent = true) {
        if ($getParent && null != $this->parent) {
            return $this->parent->getName();
        }
        return $this->name;
    }

    /**
     * Set inNo
     *
     * @param string $inNo
     *
     * @return \Device\Entity\Accounting
     */
    public function setInNo ($inNo) {
        $this->inNo = $inNo;
        return $this;
    }

    /**
     * Get inNo
     *
     * @param string $getParent[true]
     *
     * @return string
     */
    public function getInNo ($getParent = true) {
        if ($getParent && null != $this->parent) {
            return $this->parent->getInNo();
        }
        return $this->inNo;
    }

    /**
     * Set invoice
     *
     * @param string $invoice
     *
     * @return \Device\Entity\Accounting
     */
    public function setInvoice ($invoice) {
        $this->invoice = $invoice;
        return $this;
    }

    /**
     * Get invoice
     *
     * @param string $getParent[true]
     *
     * @return string
     */
    public function getInvoice ($getParent = true) {
        if ($getParent && null != $this->parent) {
            return $this->parent->getInvoice();
        }
        return $this->invoice;
    }

    /**
     * Set dateInvoice
     *
     * @param \DateTime $dateInvoice
     *
     * @return \Device\Entity\Accounting
     */
    public function setDateInvoice ($dateInvoice) {
        $this->dateInvoice = $dateInvoice;
        return $this;
    }

    /**
     * Get dateInvoice
     *
     * @param string $getParent[true]
     *
     * @return \DateTime
     */
    public function getDateInvoice ($getParent = true) {
        if ($getParent && null != $this->parent) {
            return $this->parent->getDateInvoice();
        }
        return $this->dateInvoice;
    }

    /**
     * Set dateDiscarded
     *
     * @param \DateTime $dateDiscarded
     *
     * @return \Device\Entity\Accounting
     */
    public function setDateDiscarded ($dateDiscarded) {
        $this->dateDiscarded = $dateDiscarded;
        if (null != $dateDiscarded) {
            $this->setDiscarded(true);
        }
        foreach ($this->children as $child) {
            $child->setDateDiscarded($dateDiscarded);
        }
        return $this;
    }

    /**
     * Get dateDiscarded
     *
     * @param string $getParent[true]
     *
     * @return \DateTime
     */
    public function getDateDiscarded ($getParent = true) {
        if ($getParent && null != $this->parent) {
            return $this->parent->getDateDiscarded();
        }
        return $this->dateDiscarded;
    }

    /**
     * Set discarded
     *
     * @param boolean $discarded
     *
     * @return \Device\Entity\Accounting
     */
    public function setDiscarded ($discarded) {
        $this->discarded = $discarded;
        foreach ($this->children as $child) {
            $child->setDiscarded($discarded);
        }
        return $this;
    }

    /**
     * Get discarded
     *
     * @param string $getParent[true]
     *
     * @return boolean
     */
    public function getDiscarded ($getParent = true) {
        if ($getParent && null != $this->parent) {
            return $this->parent->getDiscarded();
        }
        return $this->discarded;
    }

    /**
     * Check whether the root property
     *
     * @return boolean
     */
    public function isRoot () {
        return null == $this->parent && $this->children->count() > 0;
    }

    /**
     * Is children
     *
     * @return  boolean
     */
    public function isChild () {
        return null != $this->parent;
    }

    /**
     * Check whether the device is decommissioned
     *
     * @return boolean
     */
    public function isDiscarded () {
        if ($this->parent) {
            return $this->parent->isDiscarded();
        }
        return $this->discarded || $this->discarded instanceof \DateTime;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбрано устройство!';
        }
        if (null == $this->inNo && null == $this->dateInvoice) {
            $errors[] = 'Не указана информация о постановке на учет (инвентарный номер или дата постановки на учет)!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ($this->device) {
            $errors[] = 'Нельзя удалить информацию о учете, пока есть устройство!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


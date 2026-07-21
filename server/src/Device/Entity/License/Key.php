<?php

namespace Device\Entity\License;

use Device\Entity\Software as BaseSoftware;
use Device\Repository\License\KeyRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_license_key')]
#[ORM\UniqueConstraint(columns: ['license_software_id', 'software_id', 'type_key'])]
#[ORM\Entity(repositoryClass: KeyRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Key {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'type_key', length: 191, nullable: false, options: ['default' => "VLK"])]
    private $typeKey = 'VLK';

    #[ORM\Column(name: 'value', length: 255, nullable: true, unique: false)]
    private $value;

    #[ORM\Column(name: 'actived', length: 255, nullable: true, unique: false)]
    private $actived;

    #[ORM\ManyToOne(targetEntity: Software::class, inversedBy: 'keys')]
    #[ORM\JoinColumn(name: 'license_software_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $licenseSoftware;

    #[ORM\ManyToOne(targetEntity: BaseSoftware::class)]
    #[ORM\JoinColumn(name: 'software_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $software;

    /**
     * Get id
     *
     * @return integer
     */
    public function getId () {
        return $this->id;
    }

    /**
     * Set typeKey
     *
     * @param string $typeKey
     *
     * @return \Device\Entity\License\Key
     */
    public function setTypeKey ($typeKey) {
        $this->typeKey = $typeKey;

        return $this;
    }

    /**
     * Get typeKey
     *
     * @return string
     */
    public function getTypeKey () {
        return $this->typeKey;
    }

    /**
     * Set value
     *
     * @param string $value
     *
     * @return Key
     */
    public function setValue ($value) {
        $this->value = $value;

        return $this;
    }

    /**
     * Get value
     *
     * @return string
     */
    public function getValue () {
        return $this->value;
    }

    /**
     * Set actived
     *
     * @param string $actived
     *
     * @return Key
     */
    public function setActived ($actived) {
        $this->actived = $actived;

        return $this;
    }

    /**
     * Get actived
     *
     * @return string
     */
    public function getActived () {
        return $this->actived;
    }

    /**
     * Set licenseSoftware
     *
     * @param \Device\Entity\License\Software $licenseSoftware
     * @param boolean $addKey[true]
     *
     * @return \Device\Entity\License\Key
     */
    public function setLicenseSoftware (\Device\Entity\License\Software $licenseSoftware = null, $addKey = true) {
        if ((null === $licenseSoftware || $this->licenseSoftware !== $licenseSoftware) && null !== $this->licenseSoftware) {
            $this->licenseSoftware->removeKey($this, false);
        }

        $this->licenseSoftware = $licenseSoftware;

        if (true === $addKey && null !== $this->licenseSoftware) {
            $this->licenseSoftware->addKey($this, false);
        }

        return $this;
    }

    /**
     * Get licenseSoftware
     *
     * @return \Device\Entity\License\Software
     */
    public function getLicenseSoftware () {
        return $this->licenseSoftware;
    }

    /**
     * Set software
     *
     * @param \Device\Entity\Software $software
     *
     * @return \Device\Entity\License\Key
     */
    public function setSoftware (\Device\Entity\Software $software = null) {
        $this->software = $software;

        return $this;
    }

    /**
     * Get software
     *
     * @return \Device\Entity\Software
     */
    public function getSoftware () {
        return $this->software;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if (!$this->typeKey) {
            $errors[] = 'Не выбран тип ключа!';
        }

        if (!$this->value && !$this->actived) {
            $errors[] = 'Не введен ключ или код активации!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getObjectManager()->getRepository('Device\Entity\Device\License')->count(array(
                'key' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить ключ "'.$this->typeKey.' - '.$this->getValue().'" из лицензии "'.$this->licenseSoftware->getName().'" для программы "'.$this->software->getName().'", пока он используеться!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


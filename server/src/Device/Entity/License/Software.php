<?php

namespace Device\Entity\License;

use Device\Entity\License as LicenseEntity;
use Device\Entity\Software as BaseSoftware;
use Device\Repository\License\SoftwareRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_license_software')]
#[ORM\UniqueConstraint(columns: ['license_id', 'software_id'])]
#[ORM\Entity(repositoryClass: SoftwareRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Software
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'count', type: Types::INTEGER, nullable: true, unique: false)]
    private $count;

    #[ORM\ManyToOne(targetEntity: LicenseEntity::class, inversedBy: 'softwares')]
    #[ORM\JoinColumn(name: 'license_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $license;

    #[ORM\ManyToOne(targetEntity: BaseSoftware::class)]
    #[ORM\JoinColumn(name: 'software_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $software;

    #[ORM\OneToMany(targetEntity: Key::class, mappedBy: 'licenseSoftware')]
    private $keys;

    /**
     * Construct
     */
    public function __construct () {
        $this->keys = new \Doctrine\Common\Collections\ArrayCollection();
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
     * New key
     *
     * @param \Device\Entity\Software $software
     *
     * @return \Device\Entity\License\Key
     */
    public function newKey (\Device\Entity\Software $software) {
        $key = new Key;
        $this->addKey($key);
        $key->setSoftware($software);

        return $key;
    }

    /**
     * Add key
     *
     * @param \Device\Entity\License\Key $key
     * @param boolean $setLicense[true]
     *
     * @return \Device\Entity\License\Software
     */
    public function addKey (Key $key, $setLicense = true) {
        if (false === $this->keys->indexOf($key)) {
            $this->keys[] = $key;
        }

        if (true === $setLicense) {
            $key->setLicenseSoftware($this, false);
        }

        return $this;
    }

    /**
     * Remove software
     *
     * @param \Device\Entity\License\Key $key
     * @param boolean $removeLicense[true]
     *
     * @return \Device\Entity\License\Software
     */
    public function removeKey (\Device\Entity\License\Key $key, $removeLicense = true) {
        $this->keys->removeElement($key);

        if (true === $removeLicense) {
            $key->setLicenseSoftware(null, false);
        }

        return $this;
    }

    /**
     * Get softwares
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getKeys () {
        return $this->keys;
    }

    /**
     * Set count
     *
     * @param integer $count
     *
     * @return Software
     */
    public function setCount ($count) {
        $this->count = $count;

        return $this;
    }

    /**
     * Get count
     *
     * @return integer
     */
    public function getCount () {
        return $this->count;
    }

    /**
     * Set license
     *
     * @param \Device\Entity\License $license
     * @param boolean $addSoftware[true]
     *
     * @return \Device\Entity\License\Software
     */
    public function setLicense (\Device\Entity\License $license = null, $addSoftware = true) {
        if ((null === $license || $this->license !== $license) && null !== $this->license) {
            $this->license->removeSoftware($this, false);
        }

        $this->license = $license;

        if (true === $addSoftware && null !== $this->license) {
            $this->license->addSoftware($this, false);
        }
        return $this;
    }

    /**
     * Get license
     *
     * @return \Device\Entity\License
     */
    public function getLicense ()  {
        return $this->license;
    }

    /**
     * Set software
     *
     * @param \Device\Entity\Software $software
     *
     * @return \Device\Entity\License\Software
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

    /**
     * Get software
     *
     * @param $license[true]
     *
     * @return string|null
     */
    public function getName ($license = true) {
        if (true == $license && $this->license && $this->software) {
            return $this->license->getCode().' - '. $this->software->getName();
        }

        if ($this->software) {
            return $this->software->getName();
        }
        return null;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$this->count < 1 && $this->count != -1) {
            $errors[] = 'Количество должно быть положительным или -1, если не ограниченно!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('Device\Entity\Device\License')->count(array(
                'licenseSoftware' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName(false).'" из лицензии "'.$this->license->getCode().'", пока она установлена!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


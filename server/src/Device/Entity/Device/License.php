<?php

namespace Device\Entity\Device;

use Device\Entity\Device as DeviceEntity;
use Device\Entity\License\Key as LicenseKey;
use Device\Entity\License\Software as LicenseSoftware;
use Device\Entity\Software as BaseSoftware;
use Device\Repository\Device\LicenseRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_device_license')]
#[ORM\Entity(repositoryClass: LicenseRepository::class)]
#[ORM\HasLifecycleCallbacks]
class License
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: DeviceEntity::class, inversedBy: 'licenses')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $device;

    #[ORM\ManyToOne(targetEntity: LicenseSoftware::class)]
    #[ORM\JoinColumn(name: 'license_software_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $licenseSoftware;

    #[ORM\ManyToOne(targetEntity: BaseSoftware::class)]
    #[ORM\JoinColumn(name: 'software_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $software;

    #[ORM\ManyToOne(targetEntity: LicenseKey::class)]
    #[ORM\JoinColumn(name: 'key_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $key;

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
     * Set device
     *
     * @param \Device\Entity\Device $device
     * @param boolean $addLicense[true]
     *
     * @return License
     */
    public function setDevice(\Device\Entity\Device $device = null, $addLicense = true)
    {
        if ((null === $device || $this->device !== $device) && null !== $this->device) {
            $this->device->removeLicense($this, false);
        }

        $this->device = $device;

        if (true === $addLicense && null !== $this->device) {
            $this->device->addLicense($this, false);
        }

        return $this;
    }

    /**
     * Get device
     *
     * @return \Device\Entity\Device
     */
    public function getDevice()
    {
        return $this->device;
    }

    /**
     * Set licenseSoftware
     *
     * @param \Device\Entity\License\Software $licenseSoftware
     *
     * @return License
     */
    public function setLicenseSoftware(\Device\Entity\License\Software $licenseSoftware = null)
    {
        $this->licenseSoftware = $licenseSoftware;

        return $this;
    }

    /**
     * Get licenseSoftware
     *
     * @return \Device\Entity\License\Software
     */
    public function getLicenseSoftware()
    {
        return $this->licenseSoftware;
    }

    /**
     * Set software
     *
     * @param \Device\Entity\Software $software
     *
     * @return License
     */
    public function setSoftware(\Device\Entity\Software $software = null)
    {
        $this->software = $software;

        return $this;
    }

    /**
     * Get software
     *
     * @return \Device\Entity\Software
     */
    public function getSoftware()
    {
        return $this->software;
    }

    /**
     * Set key
     *
     * @param \Device\Entity\License\Key $key
     *
     * @return License
     */
    public function setKey(\Device\Entity\License\Key $key = null)
    {
        $this->key = $key;

        if (null === $this->key) {
            $this->setSoftware(null);
        } else {
            $this->setSoftware($this->key->getSoftware());
        }

        return $this;
    }

    /**
     * Get key
     *
     * @return \Device\Entity\License\Key
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * Get name
     *
     * @param $license[true]
     *
     * @return string|null
     */
    public function getName($license = true)
    {
        if ($this->licenseSoftware) {
            return $this->licenseSoftware->getName($license);
        }

        return null;
    }

    /**
     * Get value
     *
     * @param boolean $type[true]
     *
     * @return string|null
     */
    public function getValue($type = true)
    {
        if ($this->key) {
            if (true === $type) {
                return $this->key->getTypeKey().' - '.$this->key->getValue();
            }

            return $this->key->getValue();
        }

        return null;
    }

    /**
     * Get actived
     *
     * @param boolean $type[true]
     *
     * @return string|null
     */
    public function getActived($type = true)
    {
        if ($this->key) {
            if (true === $type) {
                return $this->key->getTypeKey().' - '.$this->key->getActived();
            }

            return $this->key->getActived();
        }

        return null;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбрано устройство!';
        }
        if (null == $this->licenseSoftware) {
            $errors[] = 'Не указана лицензия!';
        }
        if (null == $this->software) {
            $errors[] = 'Не указана программа!';
        }
        if (null == $this->key) {
            $errors[] = 'Не выбран ключ для установки!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


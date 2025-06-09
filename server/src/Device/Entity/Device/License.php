<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Entity\Software;
use Device\Entity\License\Software as LicenseSoftware;
use Device\Entity\License\Key;
use Device\Repository\Device\LicenseRepository;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_device_license')]
#[ORM\Entity(repositoryClass: LicenseRepository::class)]
#[ORM\HasLifecycleCallbacks]
class License {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'licenses')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: "CASCADE")]
    private ?Device $device = null;

    #[ORM\ManyToOne(targetEntity: LicenseSoftware::class)]
    #[ORM\JoinColumn(name: 'license_software_id', referencedColumnName: 'id', nullable: false, onDelete: "RESTRICT")]
    private LicenseSoftware $licenseSoftware;

    #[ORM\ManyToOne(targetEntity: Software::class)]
    #[ORM\JoinColumn(name: 'software_id', referencedColumnName: 'id', nullable: false, onDelete: "RESTRICT")]
    private Software $software;

    #[ORM\ManyToOne(targetEntity: Key::class)]
    #[ORM\JoinColumn(name: 'key_id', referencedColumnName: 'id', nullable: false, onDelete: "RESTRICT")]
    private Key $key;

    public function getId (): ?int {
        return $this->id;
    }

    public function getDevice (): Device {
        return $this->device;
    }
    public function setDevice(?Device $device = null): self {
        if (isset($this->device) && ($this->device !== $device)) {
            $this->device->removeLicense($this);
        }

        $this->device = $device;

        if ($this->device) {
            $this->device->addLicense($this, false);
        }

        return $this;
    }

    public function getLicenseSoftware (): LicenseSoftware {
        return $this->licenseSoftware;
    }
    public function setLicenseSoftware (LicenseSoftware $licenseSoftware): self {
        $this->licenseSoftware = $licenseSoftware;

        return $this;
    }

    public function getSoftware (): Software {
        return $this->software;
    }
    public function setSoftware (Software $software): self{
        $this->software = $software;

        return $this;
    }

    public function getKey (): Key {
        return $this->key;
    }
    public function setKey (Key $key): self {
        $this->key = $key;

        if (null === $this->key) {
            $this->setSoftware();
        } else {
            $this->setSoftware($this->key->getSoftware());
        }

        return $this;
    }

    public function getName ($license = true): ?string {
        if ($this->licenseSoftware) {
            return $this->licenseSoftware->getName($license);
        }

        return null;
    }
    public function getValue ($type = true): ?string {
        if ($this->key) {
            if (true === $type) {
                return $this->key->getTypeKey().' - '.$this->key->getValue();
            }

            return $this->key->getValue();
        }

        return null;
    }
    public function getActived ($type = true): ?string {
        if ($this->key) {
            if (true === $type) {
                return $this->key->getTypeKey().' - '.$this->key->getActived();
            }

            return $this->key->getActived();
        }

        return null;
    }

    #[ORM\PrePersist]
    public function prePersist(PrePersistEventArgs $event): void {
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
    #[ORM\PreUpdate]
    public function preUpdate (PreUpdateEventArgs $event): void {
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


<?php

namespace Device\Entity\License;

use Device\Entity\Software as BaseSoftware;
use Device\Entity\License\Software as LicenseSoftware;

use Device\Repository\License\KeyRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;


#[ORM\Table(name: 'd_license_key')]
#[ORM\Entity(repositoryClass: KeyRepository::class)]
#[ORM\UniqueConstraint(columns: ["license_software_id", "software_id", "type_key"])]
#[ORM\HasLifecycleCallbacks]
class Key {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: LicenseSoftware::class, inversedBy: 'keys')]
    #[ORM\JoinColumn(name: 'license_software_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    private LicenseSoftware $licenseSoftware;

    #[ORM\ManyToOne(targetEntity: BaseSoftware::class)]
    #[ORM\JoinColumn(name: 'software_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    private ?BaseSoftware $software = null;

    #[ORM\Column(name: 'type_key', length: 191, options: ["default" => "VLK"])]
    private string $typeKey = 'VLK';

    #[ORM\Column(name: 'value', length: 255)]
    private string $value = '';

    #[ORM\Column(name: 'actived', length: 255)]
    private string $actived = '';

    public function getId (): ?int {
        return $this->id;
    }

    public function getSoftware (): ?BaseSoftware {
        return $this->software;
    }
    public function setSoftware (?BaseSoftware $software = null): self {
        $this->software = $software;

        return $this;
    }

    public function getTypeKey (): string {
        return $this->typeKey;
    }
    public function setTypeKey (string $typeKey): self {
        $this->typeKey = $typeKey;

        return $this;
    }

    public function getValue (): string {
        return $this->value;
    }
    public function setValue (string $value): self {
        $this->value = $value;

        return $this;
    }

    public function getActived (): string {
        return $this->actived;
    }
    public function setActived (string $actived): self {
        $this->actived = $actived;

        return $this;
    }


    public function getLicenseSoftware (): LicenseSoftware {
        return $this->licenseSoftware;
    }
    public function setLicenseSoftware (LicenseSoftware $licenseSoftware): self {
        if (isset($this->licenseSoftware) && ($this->licenseSoftware !== $licenseSoftware)) {
            $this->licenseSoftware->removeKey($this);
        }

        $this->licenseSoftware = $licenseSoftware;

        if ($this->licenseSoftware) {
            $this->licenseSoftware->addKey($this);
        }

        return $this;
    }

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
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('App\Entity\Device\License')->count(array(
                'key' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить ключ "'.$this->typeKey.' - '.$this->getValue().'" из лицензии "'.$this->licenseSoftware->getName().'" для программы "'.$this->software->getName().'", пока он используеться!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


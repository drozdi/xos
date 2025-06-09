<?php

namespace Device\Entity\License;


use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;

use Device\Entity\Software as BaseSoftware;
use Device\Entity\License;
use Device\Entity\License\Software as LicenseSoftware;

use Device\Repository\License\SoftwareRepository;


#[ORM\Table(name: 'd_license_software')]
#[ORM\Entity(repositoryClass: SoftwareRepository::class)]
#[ORM\UniqueConstraint(columns: ["license_id", "software_id"])]
#[ORM\HasLifecycleCallbacks]
class Software {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: License::class, inversedBy: "softwares")]
    #[ORM\JoinColumn(name: 'license_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    private ?License $license = null;

    #[ORM\ManyToOne(targetEntity: BaseSoftware::class)]
    #[ORM\JoinColumn(name: 'software_id', referencedColumnName: 'id', onDelete: "RESTRICT")]
    private BaseSoftware $software;

    /**
     * @var Collection<int, Key>
     */
    #[ORM\OneToMany(mappedBy: 'licenseSoftware', targetEntity: Key::class)]
    private Collection $keys;

    #[ORM\Column(name: 'count', type: Types::INTEGER)]
    private int $count;

    public function __construct () {
        $this->keys = new ArrayCollection();
    }

    public function getId (): ?int {
        return $this->id;
    }


    public function newKey (BaseSoftware $software): Key {
        $key = new Key;
        $this->addKey($key);
        $key->setSoftware($software);

        return $key;
    }


    public function addKey (Key $key): self {
        if (!$this->keys->contains($key)) {
            $this->keys->add($key);
            $key->setLicenseSoftware($this);
        }

        return $this;
    }
    public function removeKey (Key $key): self {
        if ($this->keys->removeElement($key)) {
            $key->setLicenseSoftware(null);
        }
        return $this;
    }

    /**
     * Get softwares
     *
     * @return Collection<int, Key>
     */
    public function getKeys (): Collection {
        return $this->keys;
    }


    public function getLicense (): License  {
        return $this->license;
    }
    public function setLicense (?License $license = null): self {
        if (isset($this->license) && ($this->license != $license)) {
            $this->license->removeSoftware($this);
        }

        $this->license = $license;

        if ($this->license) {
            $this->license->addSoftware($this);
        }
        return $this;
    }

    public function getSoftware (): ?BaseSoftware {
        return $this->software;
    }
    public function setSoftware (?BaseSoftware $software = null): self {
        $this->software = $software;

        return $this;
    }

    public function getCount (): int {
        return $this->count;
    }
    public function setCount (int $count): self {
        $this->count = $count;

        return $this;
    }

    public function getName ($license = true): ?string {
        if (true == $license && $this->license && $this->software) {
            return $this->license->getCode().' - '. $this->software->getName();
        }

        if ($this->software) {
            return $this->software->getName();
        }
        return null;
    }


    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$this->count < 1 && $this->count != -1) {
            $errors[] = 'Количество должно быть положительным или -1, если не ограниченно!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('App\Entity\Device\License')->count(array(
                'licenseSoftware' => $this->getId()
            )) > 0) {
            $errors[] = 'Нельзя удалить программу "'.$this->getName(false).'" из лицензии "'.$this->license->getCode().'", пока она установлена!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


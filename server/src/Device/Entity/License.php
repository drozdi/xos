<?php

namespace Device\Entity;

use Device\Entity\License\Software as LicenseSoftware;
use Device\Repository\LicenseRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_license')]
#[ORM\Entity(repositoryClass: LicenseRepository::class)]
#[ORM\HasLifecycleCallbacks]
class License
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'code', length: 255, nullable: false, unique: true)]
    private $code;

    #[ORM\Column(name: 'type', length: 255, nullable: false)]
    private $type;

    #[ORM\Column(name: 'aut_no', length: 255, nullable: true, unique: false)]
    private $autNo;

    #[ORM\Column(name: 'no', length: 255, nullable: true, unique: false)]
    private $no;

    #[ORM\Column(name: 'date_real', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $dateReal;

    #[ORM\OneToMany(targetEntity: LicenseSoftware::class, mappedBy: 'license')]
    private $softwares;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: true, unique: false, options: ['default' => 100])]
    private $sort = 100;

    /**
     * Construct
     */
    public function __construct()
    {
        $this->softwares = new \Doctrine\Common\Collections\ArrayCollection();
    }

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
     * New software
     *
     * @param \Device\Entity\Software $software
     *
     * @return \Device\Entity\License\Software
     */
    public function newSoftware($software)
    {
        $licenseSoftware = new License\Software;
        $this->addSoftware($licenseSoftware);
        $licenseSoftware->setSoftware($software, false);
        return $licenseSoftware;
    }

    /**
     * Add software
     *
     * @param \Device\Entity\License\Software $software
     * @param boolean $setLicense[true]
     *
     * @return \Device\Entity\License
     */
    public function addSoftware(\Device\Entity\License\Software $software, $setLicense = true)
    {
        if (false === $this->softwares->indexOf($software)) {
            $this->softwares[] = $software;
        }

        if (true === $setLicense) {
            $software->setLicense($this, false);
        }

        return $this;
    }

    /**
     * Remove software
     *
     * @param \Device\Entity\License\Software $software
     * @param boolean $removeLicense[true]
     *
     * @return \Device\Entity\License
     */
    public function removeSoftware(\Device\Entity\License\Software $software, $removeLicense = true)
    {
        $this->softwares->removeElement($software);

        if (true === $removeLicense) {
            $software->setLicense(null, false);
        }

        return $this;
    }

    /**
     * Get softwares
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getSoftwares()
    {
        return $this->softwares;
    }

    /**
     * Set code
     *
     * @param string $code
     *
     * @return \Device\Entity\License
     */
    public function setCode($code)
    {
        $this->code = $code;

        return $this;
    }

    /**
     * Get code
     *
     * @return string
     */
    public function getCode()
    {
        return $this->code;
    }

    /**
     * Set sort
     *
     * @param integer $sort
     *
     * @return \Device\Entity\License
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
     * @param string $type
     *
     * @return \Device\Entity\License
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Set autNo
     *
     * @param string $autNo
     *
     * @return \Device\Entity\License
     */
    public function setAutNo($autNo)
    {
        $this->autNo = $autNo;

        return $this;
    }

    /**
     * Get autNo
     *
     * @return string
     */
    public function getAutNo()
    {
        return $this->autNo;
    }

    /**
     * Set no
     *
     * @param string $no
     *
     * @return \Device\Entity\License
     */
    public function setNo($no)
    {
        $this->no = $no;

        return $this;
    }

    /**
     * Get no
     *
     * @return string
     */
    public function getNo()
    {
        return $this->no;
    }

    /**
     * Set dateReal
     *
     * @param \DateTime $dateReal
     *
     * @return \Device\Entity\License
     */
    public function setDateReal($dateReal)
    {
        $this->dateReal = $dateReal;

        return $this;
    }

    /**
     * Get dateReal
     *
     * @return \DateTime
     */
    public function getDateReal()
    {
        return $this->dateReal;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
        $errors = array();

        if (null == $this->code) {
            $errors[] = 'Не вели CODE!';
        }

        $criteria = new Criteria();
        $criteria
            ->where(Criteria::expr()->neq('id', $this->id))
            ->andWhere(Criteria::expr()->eq('code', $this->code));

        if ($event->getObjectManager()->getRepository(License::class)->matching($criteria)->count() > 0) {
            $errors[] = 'Такой код уже используется!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
    #[ORM\PreRemove]
    public function preRemove(LifecycleEventArgs $event)
    {
        if ((int)$event->getObjectManager()->getRepository(Device\License::class)->count(array(
                'licenseSoftware' => $event->getObjectManager()->getRepository(License\Software::class)->findByLicense($this->getId())
            )) > 0) {
            $errors[] = 'Нельзя удалить лицензию, пока она используеться устройствами!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


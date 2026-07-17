<?php

namespace Device\Entity\Software;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_software_type')]
#[ORM\Entity(repositoryClass: TypeRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Type
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private $id;

    #[ORM\Column(name: 'name', length: 255, nullable: false, unique: false)]
    private $name;

    #[ORM\Column(name: 'code', length: 255, nullable: false, unique: true)]
    private $code;

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
     * Set name
     *
     * @param string $name
     *
     * @return \Device\Entity\Software\Type
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @param boolean $code[true]
     *
     * @return string
     */
    public function getName($code = true)
    {
        if (true === $code && !$this->name) {
            return $this->getCode();
        }
        return $this->name;
    }

    /**
     * Set code
     *
     * @param string $code
     *
     * @return \Device\Entity\Software\Type
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
     * @return \Device\Entity\Software\Type
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

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
        $errors = array();

        if (null == $this->name) {
            $errors[] = 'Не вели название!';
        }
        if (null == $this->code) {
            $errors[] = 'Не вели CODE!';
        }
        $criteria = new Criteria();
        $criteria
            ->where(Criteria::expr()->neq('id', $this->id))
            ->andWhere(Criteria::expr()->eq('code', $this->code));
        if ($event->getEntityManager()->getRepository('Device\Entity\Software\Type')->matching($criteria)->count() > 0) {
            $errors[] = 'Такой код уже используется!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove(LifecycleEventArgs $event)
    {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('Device\Entity\Software')->count(array(
            'type' => $this->getId()
        )) > 0) {
            $errors[] = 'Нельзя удалить пока есть программы!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


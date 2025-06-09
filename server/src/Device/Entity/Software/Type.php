<?php

namespace Device\Entity\Software;

use Device\Repository\Software\TypeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Table(name: 'd_software_type')]
#[ORM\Entity(repositoryClass: TypeRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Type {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "code", length: 191, unique: true)]
    #[Assert\NotBlank(
        message: 'Код типа должен быть указан'
    )]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank(
        message: 'Нозвание должно быть указано'
    )]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    public function getId (): ?int {
        return $this->id;
    }
    public function getCode (): ?string {
        return $this->code;
    }
    public function setCode (string $code): self {
        $this->code = $code;

        return $this;
    }
    public function getName (): ?string {
        return $this->name;
    }
    public function setName (string $name): self {
        $this->name = $name;

        return $this;
    }
    public function getSort (): ?int {
        return $this->sort;
    }
    public function setSort (int $sort): self {
        $this->sort = $sort;

        return $this;
    }

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
        if ($event->getEntityManager()->getRepository('App\Entity\Software\Type')->matching($criteria)->count() > 0) {
            $errors[] = 'Такой код уже используется!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    public function preRemove(LifecycleEventArgs $event)
    {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('App\Entity\Software')->count(array(
            'type' => $this->getId()
        )) > 0) {
            $errors[] = 'Нельзя удалить пока есть программы!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}


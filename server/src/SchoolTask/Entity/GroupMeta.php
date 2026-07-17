<?php

namespace SchoolTask\Entity;

use Doctrine\ORM\Mapping as ORM;
use Main\Entity\Group;
use SchoolTask\Repository\GroupMetaRepository;

#[ORM\Entity(repositoryClass: GroupMetaRepository::class)]
#[ORM\Table(name: 'st_group_meta')]
class GroupMeta
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Group::class)]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Group $group;

    #[ORM\ManyToOne(targetEntity: EpSubject::class)]
    #[ORM\JoinColumn(name: 'subject_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?EpSubject $subject = null;

    public function getGroup(): Group
    {
        return $this->group;
    }

    public function setGroup(Group $group): self
    {
        $this->group = $group;

        return $this;
    }

    public function getSubject(): ?EpSubject
    {
        return $this->subject;
    }

    public function setSubject(?EpSubject $subject): self
    {
        $this->subject = $subject;

        return $this;
    }
}

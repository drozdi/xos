<?php

namespace Todo\Entity;

use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Todo\Repository\TodoListShareRepository;

#[ORM\Entity(repositoryClass: TodoListShareRepository::class)]
#[ORM\Table(name: 'todo_list_share')]
#[ORM\UniqueConstraint(name: 'UNIQ_TODO_LIST_SHARE', columns: ['list_id', 'user_id'])]
class TodoListShare
{
    public const PERMISSION_READ = 'read';
    public const PERMISSION_WRITE = 'write';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TodoList::class, inversedBy: 'shares')]
    #[ORM\JoinColumn(name: 'list_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?TodoList $list = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 16, options: ['default' => self::PERMISSION_READ])]
    private string $permission = self::PERMISSION_READ;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getList(): ?TodoList
    {
        return $this->list;
    }

    public function setList(?TodoList $list): self
    {
        $this->list = $list;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getPermission(): string
    {
        return $this->permission;
    }

    public function setPermission(string $permission): self
    {
        $this->permission = $permission;

        return $this;
    }

    public function canWrite(): bool
    {
        return self::PERMISSION_WRITE === $this->permission;
    }
}

<?php

namespace Inbox\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Inbox\Repository\MessageRepository;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: MessageRepository::class)]
#[ORM\Table(name: 'inbox_message')]
#[ORM\Index(name: 'IDX_inbox_message_to_user', columns: ['to_user_id'])]
#[ORM\Index(name: 'IDX_inbox_message_from_user', columns: ['from_user_id'])]
#[ORM\HasLifecycleCallbacks]
class Message
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'from_user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $fromUser;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'to_user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $toUser;

    #[ORM\Column(name: 'subject', length: 255)]
    private string $subject = '';

    #[ORM\Column(name: 'body_md', type: Types::TEXT)]
    private string $bodyMd = '';

    #[ORM\Column(name: 'read_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $readAt = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct(User $fromUser, User $toUser)
    {
        $this->fromUser = $fromUser;
        $this->toUser = $toUser;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (null === $this->createdAt) {
            $this->createdAt = new \DateTime();
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFromUser(): User
    {
        return $this->fromUser;
    }

    public function getToUser(): User
    {
        return $this->toUser;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }

    public function setSubject(string $subject): self
    {
        $this->subject = $subject;

        return $this;
    }

    public function getBodyMd(): string
    {
        return $this->bodyMd;
    }

    public function setBodyMd(string $bodyMd): self
    {
        $this->bodyMd = $bodyMd;

        return $this;
    }

    public function getReadAt(): ?\DateTimeInterface
    {
        return $this->readAt;
    }

    public function setReadAt(?\DateTimeInterface $readAt): self
    {
        $this->readAt = $readAt;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }
}

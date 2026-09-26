<?php

namespace Inbox\Service;

use Doctrine\ORM\EntityManagerInterface;
use Inbox\Entity\Message;
use Inbox\Repository\MessageRepository;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class InboxManager
{
    public function __construct(
        private readonly MessageRepository $messageRepository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listMessages(User $user, string $box = 'inbox'): array
    {
        $messages = 'sent' === $box
            ? $this->messageRepository->findSentFor($user)
            : $this->messageRepository->findInboxFor($user);

        return array_map(fn (Message $m) => $this->serialize($m, $user), $messages);
    }

    /**
     * @return array<string, mixed>
     */
    public function getMessage(int $id, User $user): array
    {
        $message = $this->findAccessible($id, $user);
        if ($message->getToUser()->getId() === $user->getId() && null === $message->getReadAt()) {
            $message->setReadAt(new \DateTime());
            $this->entityManager->flush();
        }

        return $this->serialize($message, $user, true);
    }

    /**
     * @param array{to_email?: string, to_user_id?: int, subject?: string, body_md?: string} $data
     *
     * @return array<string, mixed>
     */
    public function createMessage(User $from, array $data): array
    {
        $to = $this->resolveRecipient($data);
        if ($to->getId() === $from->getId()) {
            throw new BadRequestHttpException('Нельзя отправить сообщение самому себе');
        }

        $subject = trim((string) ($data['subject'] ?? ''));
        $body = (string) ($data['body_md'] ?? '');
        if ('' === $subject) {
            throw new BadRequestHttpException('Укажите subject');
        }

        $message = new Message($from, $to);
        $message->setSubject(mb_substr($subject, 0, 255));
        $message->setBodyMd($body);
        $this->entityManager->persist($message);
        $this->entityManager->flush();

        return $this->serialize($message, $from, true);
    }

    public function markRead(int $id, User $user): array
    {
        $message = $this->findAccessible($id, $user);
        if ($message->getToUser()->getId() !== $user->getId()) {
            throw new AccessDeniedHttpException('Только получатель может отметить прочтение');
        }
        if (null === $message->getReadAt()) {
            $message->setReadAt(new \DateTime());
            $this->entityManager->flush();
        }

        return $this->serialize($message, $user, true);
    }

    public function deleteMessage(int $id, User $user): void
    {
        $message = $this->findAccessible($id, $user);
        $this->entityManager->remove($message);
        $this->entityManager->flush();
    }

    private function findAccessible(int $id, User $user): Message
    {
        $message = $this->messageRepository->find($id);
        if (!$message instanceof Message) {
            throw new NotFoundHttpException('Сообщение не найдено');
        }
        $uid = $user->getId();
        if ($message->getFromUser()->getId() !== $uid && $message->getToUser()->getId() !== $uid) {
            throw new AccessDeniedHttpException('Нет доступа к сообщению');
        }

        return $message;
    }

    /**
     * @param array{to_email?: string, to_user_id?: int} $data
     */
    private function resolveRecipient(array $data): User
    {
        if (isset($data['to_user_id']) && (int) $data['to_user_id'] > 0) {
            $user = $this->userRepository->find((int) $data['to_user_id']);
            if ($user instanceof User) {
                return $user;
            }
        }

        $email = trim((string) ($data['to_email'] ?? ''));
        if ('' === $email) {
            throw new BadRequestHttpException('Укажите to_email или to_user_id');
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if (!$user instanceof User) {
            throw new BadRequestHttpException('Получатель не найден');
        }

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Message $message, User $viewer, bool $withBody = false): array
    {
        $from = $message->getFromUser();
        $to = $message->getToUser();

        $row = [
            'id' => $message->getId(),
            'subject' => $message->getSubject(),
            'from' => [
                'id' => $from->getId(),
                'email' => $from->getEmail(),
                'alias' => method_exists($from, 'getAlias') ? $from->getAlias() : null,
            ],
            'to' => [
                'id' => $to->getId(),
                'email' => $to->getEmail(),
                'alias' => method_exists($to, 'getAlias') ? $to->getAlias() : null,
            ],
            'read_at' => $message->getReadAt()?->format('Y-m-d H:i:s'),
            'created_at' => $message->getCreatedAt()?->format('Y-m-d H:i:s'),
            'is_inbox' => $to->getId() === $viewer->getId(),
            'is_unread' => $to->getId() === $viewer->getId() && null === $message->getReadAt(),
        ];
        if ($withBody) {
            $row['body_md'] = $message->getBodyMd();
        }

        return $row;
    }
}

<?php

namespace Ssh\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Ssh\Entity\SshKey;
use Ssh\Repository\SshConnectionRepository;
use Ssh\Repository\SshKeyRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SshKeyManager
{
    public function __construct(
        private readonly SshKeyRepository $keys,
        private readonly SshConnectionRepository $connections,
        private readonly EntityManagerInterface $entityManager,
        private readonly SshSecretCipher $cipher,
        private readonly SshKeyFactory $factory,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(User $user): array
    {
        return array_map($this->serialize(...), $this->keys->findForUser($user));
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function import(User $user, array $data): array
    {
        $name = $this->name($data['name'] ?? null);
        $secret = trim((string) ($data['secret'] ?? ''));
        if ('' === $secret || strlen($secret) > 100_000 || !str_contains($secret, 'PRIVATE KEY')) {
            throw new BadRequestHttpException('Приватный ключ заполнен неверно');
        }
        $passphrase = $this->passphrase($data['passphrase'] ?? null);
        $material = $this->factory->import($secret, $passphrase, $name);

        return $this->store($user, $name, $material, $passphrase);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function generate(User $user, array $data): array
    {
        $name = $this->name($data['name'] ?? null);
        $type = $data['type'] ?? 'ed25519';
        if ('ed25519' !== $type && 'rsa' !== $type) {
            throw new BadRequestHttpException('Тип ключа заполнен неверно');
        }
        $passphrase = $this->passphrase($data['passphrase'] ?? null);
        $material = $this->factory->generate($type, $passphrase, $name);

        return $this->store($user, $name, $material, $passphrase);
    }

    public function delete(User $user, int $id): void
    {
        $key = $this->require($user, $id);
        if ($this->connections->countUsingKey($key) > 0) {
            throw new BadRequestHttpException('Ключ используется в подключениях');
        }
        $this->entityManager->remove($key);
        $this->entityManager->flush();
    }

    public function require(User $user, int $id): SshKey
    {
        $key = $this->keys->findOneForUser($user, $id);
        if (!$key instanceof SshKey) {
            throw new NotFoundHttpException('Ключ не найден');
        }

        return $key;
    }

    /**
     * @param array{type: string, private: string, public: string, fingerprint: string} $material
     *
     * @return array<string, mixed>
     */
    private function store(User $user, string $name, array $material, ?string $passphrase): array
    {
        $key = new SshKey($user);
        $key->setName($name)
            ->setType($material['type'])
            ->setPrivateKey($this->cipher->encrypt($material['private']))
            ->setPublicKey($material['public'])
            ->setFingerprint($material['fingerprint'])
            ->setPassphrase(null !== $passphrase && '' !== $passphrase ? $this->cipher->encrypt($passphrase) : null);
        $this->entityManager->persist($key);
        $this->entityManager->flush();

        return $this->serialize($key);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SshKey $key): array
    {
        return [
            'id' => $key->getId(),
            'name' => $key->getName(),
            'type' => $key->getType(),
            'fingerprint' => $key->getFingerprint(),
            'public_key' => $key->getPublicKey(),
            'has_passphrase' => null !== $key->getPassphrase() && '' !== $key->getPassphrase(),
        ];
    }

    private function name(mixed $value): string
    {
        $name = trim((string) $value);
        if ('' === $name || strlen($name) > 120 || preg_match('/[\x00-\x1F]/', $name)) {
            throw new BadRequestHttpException('Название заполнено неверно');
        }

        return $name;
    }

    private function passphrase(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }
        $passphrase = (string) $value;
        if ('' === $passphrase) {
            return null;
        }
        if (strlen($passphrase) > 1024) {
            throw new BadRequestHttpException('Парольная фраза слишком длинная');
        }

        return $passphrase;
    }
}

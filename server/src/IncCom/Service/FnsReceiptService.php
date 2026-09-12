<?php

namespace IncCom\Service;

use IncCom\Entity\Transaction;
use IncCom\Entity\UserFnsCredential;
use IncCom\Enum\TransactionType;
use IncCom\FnsClient\FNSApi;
use IncCom\FnsClient\Models\Ticket;
use IncCom\Repository\UserFnsCredentialRepository;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class FnsReceiptService
{
    private const MAX_POLLS = 20;
    private const POLL_SLEEP_USEC = 500000;

    public function __construct(
        private readonly UserFnsCredentialRepository $credentialRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function getCredential(User $user): ?UserFnsCredential
    {
        return $this->credentialRepository->findOneByUser($user);
    }

    public function hasCredentials(User $user): bool
    {
        $credential = $this->getCredential($user);

        return $credential instanceof UserFnsCredential
            && '' !== trim($credential->getMasterToken())
            && '' !== trim($credential->getServer())
            && '' !== trim($credential->getUsername());
    }

    /**
     * @return array{configured: bool, server: string|null, username: string|null, master_token_masked: string|null}
     */
    public function serializeCredentialPublic(User $user): array
    {
        $credential = $this->getCredential($user);
        if (!$credential instanceof UserFnsCredential) {
            return [
                'configured' => false,
                'server' => null,
                'username' => null,
                'master_token_masked' => null,
            ];
        }

        $token = $credential->getMasterToken();
        $masked = '' === $token
            ? null
            : (strlen($token) <= 8 ? str_repeat('*', strlen($token)) : substr($token, 0, 4).str_repeat('*', max(4, strlen($token) - 8)).substr($token, -4));

        return [
            'configured' => $this->hasCredentials($user),
            'server' => $credential->getServer(),
            'username' => $credential->getUsername(),
            'master_token_masked' => $masked,
        ];
    }

    /**
     * @param array{server?: string, username?: string, master_token?: string} $data
     */
    public function upsertCredential(User $user, array $data): UserFnsCredential
    {
        $server = trim((string) ($data['server'] ?? ''));
        $username = trim((string) ($data['username'] ?? ''));
        $masterToken = trim((string) ($data['master_token'] ?? ''));

        if ('' === $server || '' === $username || '' === $masterToken) {
            throw new BadRequestHttpException('Укажите server, username и master_token');
        }

        $credential = $this->getCredential($user);
        if (!$credential instanceof UserFnsCredential) {
            $credential = new UserFnsCredential($user);
            $this->entityManager->persist($credential);
        }

        $credential->setServer(rtrim($server, '/'));
        $credential->setUsername($username);
        $credential->setMasterToken($masterToken);
        $this->entityManager->flush();

        return $credential;
    }

    public function deleteCredential(User $user): void
    {
        $credential = $this->getCredential($user);
        if ($credential instanceof UserFnsCredential) {
            $this->entityManager->remove($credential);
            $this->entityManager->flush();
        }
    }

    /**
     * @param array{
     *     fn?: string|null,
     *     fd?: string|null,
     *     fp?: string|null,
     *     fpd?: string|null,
     *     amount?: string|float|int|null,
     *     date?: string|null,
     *     type?: string|null
     * } $fields
     *
     * @return array{check: array{code: int|null, message: string|null}, ticket: mixed}
     */
    public function preview(User $user, array $fields): array
    {
        return $this->checkAndGet($user, $fields);
    }

    /**
     * @param array{
     *     fn?: string|null,
     *     fd?: string|null,
     *     fp?: string|null,
     *     fpd?: string|null,
     *     amount?: string|float|int|null,
     *     date?: string|null,
     *     type?: string|null
     * } $overrides
     *
     * @return array{check: array{code: int|null, message: string|null}, ticket: mixed, transaction: Transaction}
     */
    public function fetchIntoTransaction(User $user, Transaction $transaction, array $overrides = []): array
    {
        $fields = [
            'fn' => $overrides['fn'] ?? $transaction->getFn(),
            'fd' => $overrides['fd'] ?? $transaction->getFd(),
            'fp' => $overrides['fp'] ?? $transaction->getFp(),
            'fpd' => $overrides['fpd'] ?? $transaction->getFpd(),
            'amount' => $overrides['amount'] ?? $transaction->getAmount(),
            'date' => $overrides['date'] ?? $transaction->getDate()?->format(\DateTimeInterface::ATOM),
            'type' => $overrides['type'] ?? $transaction->getType()->value,
        ];

        $result = $this->checkAndGet($user, $fields);
        $ticket = $result['ticket'];
        if (null === $ticket) {
            throw new BadRequestHttpException($result['check']['message'] ?? 'Не удалось загрузить чек');
        }

        $asArray = json_decode(json_encode($ticket, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($asArray)) {
            throw new BadRequestHttpException('Некорректный ответ ФНС');
        }

        $transaction->setReceiptJson($asArray);
        $transaction->setReceiptCheckedAt(new \DateTime());
        if (!empty($fields['fn'])) {
            $transaction->setFn((string) $fields['fn']);
        }
        if (!empty($fields['fd'])) {
            $transaction->setFd((string) $fields['fd']);
        }
        if (!empty($fields['fp'])) {
            $transaction->setFp((string) $fields['fp']);
        }
        if (!empty($fields['fpd'])) {
            $transaction->setFpd((string) $fields['fpd']);
        }
        $this->entityManager->flush();

        return [
            ...$result,
            'transaction' => $transaction,
        ];
    }

    /**
     * @param array{
     *     fn?: string|null,
     *     fd?: string|null,
     *     fp?: string|null,
     *     fpd?: string|null,
     *     amount?: string|float|int|null,
     *     date?: string|null,
     *     type?: string|null
     * } $fields
     *
     * @return array{check: array{code: int|null, message: string|null}, ticket: mixed}
     */
    private function checkAndGet(User $user, array $fields): array
    {
        $api = $this->createApi($user);
        $ticket = $this->buildTicket($fields);

        $checkMessageId = $api->getCheckTicketMessageId($ticket);
        $checkResponse = $this->poll(fn () => $api->checkTicket($checkMessageId));
        $checkResult = $checkResponse->getResult();
        $checkPayload = [
            'code' => $checkResult?->getCode(),
            'message' => $checkResult?->getMessage(),
        ];

        if (null === $checkResult) {
            throw new BadRequestHttpException('Проверка чека не завершилась вовремя');
        }

        $getMessageId = $api->getGetTicketMessageId($ticket);
        $getResponse = $this->poll(fn () => $api->getTicket($getMessageId));
        $getResult = $getResponse->getResult();
        if (null === $getResult) {
            throw new BadRequestHttpException('Загрузка чека не завершилась вовремя');
        }

        if (200 !== $getResult->getCode()) {
            return [
                'check' => $checkPayload,
                'ticket' => null,
                'error' => $getResult->getMessage() ?? 'Ошибка загрузки чека',
            ];
        }

        return [
            'check' => $checkPayload,
            'ticket' => $getResult->getTicket(),
        ];
    }

    private function createApi(User $user): FNSApi
    {
        if (!$this->hasCredentials($user)) {
            throw new BadRequestHttpException('Укажите данные ФНС');
        }
        $credential = $this->getCredential($user);
        \assert($credential instanceof UserFnsCredential);

        return new FNSApi(
            $credential->getServer(),
            $credential->getUsername(),
            $credential->getMasterToken(),
        );
    }

    /**
     * @param array{
     *     fn?: string|null,
     *     fd?: string|null,
     *     fp?: string|null,
     *     fpd?: string|null,
     *     amount?: string|float|int|null,
     *     date?: string|null,
     *     type?: string|null
     * } $fields
     */
    private function buildTicket(array $fields): Ticket
    {
        $fn = preg_replace('/\D+/', '', (string) ($fields['fn'] ?? '')) ?? '';
        $fd = preg_replace('/\D+/', '', (string) ($fields['fd'] ?? '')) ?? '';
        $fiscalSignRaw = (string) (($fields['fpd'] ?? '') ?: ($fields['fp'] ?? ''));
        $fpd = preg_replace('/\D+/', '', $fiscalSignRaw) ?? '';

        if ('' === $fn || '' === $fd || '' === $fpd) {
            throw new BadRequestHttpException('Укажите fn, fd и fpd (или fp)');
        }

        $amountRaw = $fields['amount'] ?? null;
        if (null === $amountRaw || '' === $amountRaw) {
            throw new BadRequestHttpException('Укажите сумму чека');
        }
        $sumKopeks = (int) round(((float) str_replace(',', '.', (string) $amountRaw)) * 100);
        if ($sumKopeks <= 0) {
            throw new BadRequestHttpException('Сумма чека должна быть больше 0');
        }

        $dateRaw = trim((string) ($fields['date'] ?? ''));
        if ('' === $dateRaw) {
            throw new BadRequestHttpException('Укажите дату чека');
        }
        try {
            $time = new \DateTimeImmutable($dateRaw);
        } catch (\Exception) {
            throw new BadRequestHttpException('Некорректная дата чека');
        }

        $typeValue = (string) ($fields['type'] ?? TransactionType::Expense->value);
        $operationType = TransactionType::Income->value === $typeValue ? 1 : 3;

        return new Ticket(
            $operationType,
            $time,
            $sumKopeks,
            (int) $fn,
            (int) $fd,
            (int) $fpd,
        );
    }

    /**
     * @param callable(): object $fetch
     */
    private function poll(callable $fetch): object
    {
        $last = null;
        for ($i = 0; $i < self::MAX_POLLS; ++$i) {
            $last = $fetch();
            if (method_exists($last, 'getProcessingStatus') && 'COMPLETED' === $last->getProcessingStatus()) {
                return $last;
            }
            usleep(self::POLL_SLEEP_USEC);
        }

        if (null === $last) {
            throw new BadRequestHttpException('Нет ответа от ФНС');
        }

        return $last;
    }
}

<?php

namespace App\Tests\Service;

use App\Repository\UserAppDataRepository;
use App\Service\UserAppDataValidator;
use Main\Entity\User;
use PHPUnit\Framework\TestCase;

class UserAppDataValidatorTest extends TestCase
{
    private UserAppDataValidator $validator;
    private UserAppDataRepository $repository;

    protected function setUp(): void
    {
        $this->repository = $this->createMock(UserAppDataRepository::class);
        $this->validator = new UserAppDataValidator($this->repository);
    }

    public function testValidCodeAndValue(): void
    {
        self::assertNull($this->validator->validateCode('todo.ui.filters'));
        self::assertNull($this->validator->validateValue(['status' => 'open']));
    }

    public function testEmptyCodeRejected(): void
    {
        self::assertSame('Field "code" must not be empty', $this->validator->validateCode(''));
    }

    public function testInvalidCodeCharsetRejected(): void
    {
        self::assertSame(
            'Field "code" must match ^[a-z0-9._-]+$',
            $this->validator->validateCode('Todo.UI')
        );
        self::assertSame(
            'Field "code" must match ^[a-z0-9._-]+$',
            $this->validator->validateCode('todo ui')
        );
        self::assertSame(
            'Field "code" must match ^[a-z0-9._-]+$',
            $this->validator->validateCode('todo/ui')
        );
    }

    public function testCodeTooLongRejected(): void
    {
        $code = str_repeat('a', UserAppDataValidator::MAX_CODE_LENGTH + 1);

        self::assertSame(
            sprintf('Field "code" must not exceed %d characters', UserAppDataValidator::MAX_CODE_LENGTH),
            $this->validator->validateCode($code)
        );
    }

    public function testOversizedValueRejected(): void
    {
        // JSON string quotes add 2 bytes; payload of MAX+1 chars exceeds limit when encoded.
        $value = str_repeat('x', UserAppDataValidator::MAX_VALUE_BYTES);

        $error = $this->validator->validateValue($value);

        self::assertSame(
            sprintf('Field "value" must not exceed %d bytes when JSON-encoded', UserAppDataValidator::MAX_VALUE_BYTES),
            $error
        );
    }

    public function testValueAtLimitAccepted(): void
    {
        // Encoded as "...." — 2 quote bytes, so body of MAX-2 fits exactly.
        $value = str_repeat('x', UserAppDataValidator::MAX_VALUE_BYTES - 2);

        self::assertNull($this->validator->validateValue($value));
    }

    public function testSoftQuotaBlocksInsertWhenAtLimit(): void
    {
        self::assertSame(
            sprintf('Maximum of %d keys per user exceeded', UserAppDataValidator::MAX_KEYS_PER_USER),
            $this->validator->validateQuota(UserAppDataValidator::MAX_KEYS_PER_USER, true)
        );
    }

    public function testSoftQuotaAllowsUpdateWhenAtLimit(): void
    {
        self::assertNull(
            $this->validator->validateQuota(UserAppDataValidator::MAX_KEYS_PER_USER, false)
        );
    }

    public function testSoftQuotaAllowsInsertBelowLimit(): void
    {
        self::assertNull(
            $this->validator->validateQuota(UserAppDataValidator::MAX_KEYS_PER_USER - 1, true)
        );
    }

    public function testValidateItemBlocksNewCodeAtQuota(): void
    {
        $user = new User();

        $this->repository->expects(self::once())
            ->method('findOneByUserCode')
            ->with($user, 'todo.new.key')
            ->willReturn(null);

        $this->repository->expects(self::once())
            ->method('countByUser')
            ->with($user)
            ->willReturn(UserAppDataValidator::MAX_KEYS_PER_USER);

        $error = $this->validator->validateItem([
            'code' => 'todo.new.key',
            'value' => ['ok' => true],
        ], $user);

        self::assertSame(
            sprintf('Maximum of %d keys per user exceeded', UserAppDataValidator::MAX_KEYS_PER_USER),
            $error
        );
    }
}

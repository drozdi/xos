<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Calendar\Entity\Calendar;
use Calendar\Entity\CalendarEvent;
use Calendar\Entity\CalendarShare;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class CalendarApiTest extends AuthWebTestCase
{
    public function testCalendarsRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/calendar/calendars');
        self::assertResponseStatusCodeSame(401);
    }

    public function testCrudShareAndEventQuery(): void
    {
        $client = static::createClient();
        $this->prepareCalendarDatabase($client);

        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createTestUser($client, 'cal_owner', 'password', ['ROLE_USER']);
        $owner->setEmail('cal-owner@example.com');
        $em->flush();

        $guest = $this->createTestUser($client, 'cal_guest', 'password', ['ROLE_USER']);
        $guest->setEmail('cal-guest@example.com');
        $em->flush();

        $login = $this->login($client, 'cal_owner', 'password');
        $headers = $this->jsonAuthHeaders($login['token']);

        $client->request('GET', '/api/calendar/calendars', [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var list<array{id: int, title: string}> $autoLists */
        $autoLists = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $autoLists);
        self::assertSame('Личный', $autoLists[0]['title']);
        self::assertSame('master', $autoLists[0]['type'] ?? null);
        self::assertFalse($autoLists[0]['can_delete'] ?? true);

        $client->request(
            'POST',
            '/api/calendar/calendars',
            [],
            [],
            $headers,
            json_encode(['title' => 'Работа', 'color' => '#ef5350'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int, type?: string, can_delete?: bool} $created */
        $created = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $calendarId = $created['id'];
        self::assertSame('slave', $created['type'] ?? null);
        self::assertTrue($created['can_delete'] ?? false);

        $masterId = $autoLists[0]['id'];
        $client->request('DELETE', '/api/calendar/calendars/'.$masterId, [], [], $headers);
        self::assertResponseStatusCodeSame(403);

        $client->request(
            'POST',
            '/api/calendar/events',
            [],
            [],
            $headers,
            json_encode([
                'calendar_id' => $calendarId,
                'title' => 'Встреча',
                'start_at' => '2026-07-27T10:00:00',
                'end_at' => '2026-07-27T11:00:00',
                'all_day' => false,
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/calendar/events/query',
            [],
            [],
            $headers,
            json_encode([
                'start' => '2026-07-27T00:00:00',
                'end' => '2026-07-28T00:00:00',
                'calendar_ids' => [$calendarId],
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        /** @var list<array{title: string, color: string}> $events */
        $events = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $events);
        self::assertSame('Встреча', $events[0]['title']);
        self::assertSame('#ef5350', $events[0]['color']);

        $client->request(
            'POST',
            '/api/calendar/calendars/'.$calendarId.'/share',
            [],
            [],
            $headers,
            json_encode(['email' => 'cal-guest@example.com', 'permission' => 'write'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $guestLogin = $this->login($client, 'cal_guest', 'password');
        $guestHeaders = $this->jsonAuthHeaders($guestLogin['token']);

        $client->request('GET', '/api/calendar/calendars', [], [], $guestHeaders);
        self::assertResponseIsSuccessful();
        /** @var list<array{id: int, title: string}> $guestCalendars */
        $guestCalendars = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $guestIds = array_column($guestCalendars, 'id');
        self::assertContains($calendarId, $guestIds);

        $client->request(
            'POST',
            '/api/calendar/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'cal-guest@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
    }

    private function prepareCalendarDatabase(KernelBrowser $client): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(\App\Entity\RefreshToken::class),
            $entityManager->getClassMetadata(\Main\Entity\User\Access::class),
            $entityManager->getClassMetadata(\Main\Entity\Claimant::class),
            $entityManager->getClassMetadata(\App\Entity\UserSetting::class),
            $entityManager->getClassMetadata(Calendar::class),
            $entityManager->getClassMetadata(CalendarEvent::class),
            $entityManager->getClassMetadata(CalendarShare::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    /**
     * @return array<string, string>
     */
    protected function jsonAuthHeaders(string $token): array
    {
        return [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}

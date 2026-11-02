<?php

namespace App\Tests\Device;

use Device\Repository\Software\TypeRepository;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class SoftwareTypeQueryTest extends KernelTestCase
{
    public function testMaliciousSortAndFilterStayOutOfDql(): void
    {
        self::bootKernel();
        /** @var TypeRepository $repo */
        $repo = self::getContainer()->get(TypeRepository::class);
        $query = $repo->getQueryBuilder(
            ['name' => "x' OR '1'='1"],
            [['key' => 'name) OR 1=1', 'order' => 'DESC; DROP']],
        );
        $dql = $query->getDQL();

        self::assertStringNotContainsString('DROP', $dql);
        self::assertStringNotContainsString('OR 1=1', $dql);
        self::assertStringNotContainsString("OR '1'", $dql);
        self::assertStringContainsString(':filter_', $dql);
    }
}

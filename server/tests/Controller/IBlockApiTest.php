<?php



namespace App\Tests\Controller;



use App\Tests\AuthWebTestCase;

use Doctrine\ORM\EntityManagerInterface;

use Doctrine\ORM\Tools\SchemaTool;

use IBlock\Entity\Block;

use IBlock\Entity\Element;

use IBlock\Entity\Property;

use IBlock\Entity\Property\Enum as PropertyEnum;

use IBlock\Entity\Section;

use IBlock\Entity\Type;



class IBlockApiTest extends AuthWebTestCase

{

    protected function prepareIBlockDatabase($client): void

    {

        $this->resetAuthSchema($client);

        $this->resetIBlockSchema($client);

        $this->createTestUser($client, roles: ['ROLE_ROOT']);

    }



    protected function resetIBlockSchema($client): void

    {

        /** @var EntityManagerInterface $entityManager */

        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $metadata = [

            $entityManager->getClassMetadata(Type::class),

            $entityManager->getClassMetadata(Property::class),

            $entityManager->getClassMetadata(PropertyEnum::class),

            $entityManager->getClassMetadata(Block::class),

            $entityManager->getClassMetadata(Section::class),

            $entityManager->getClassMetadata(Element::class),

        ];



        $schemaTool = new SchemaTool($entityManager);

        $schemaTool->dropSchema($metadata);

        $schemaTool->createSchema($metadata);

    }



    public function testIBlockCrudFlow(): void

    {

        $client = static::createClient();

        $this->prepareIBlockDatabase($client);



        $loginPayload = $this->login($client);

        $headers = $this->authHeaders($loginPayload['token']);



        $client->request(

            'POST',

            '/api/iblock/type/',

            [],

            [],

            $headers,

            json_encode([

                'code' => 'news_type',

                'name' => 'News Type',

                'sort' => 100,

                'active' => true,

            ], JSON_THROW_ON_ERROR)

        );

        self::assertResponseStatusCodeSame(201);

        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertGreaterThan(0, $typeId);



        $client->request(

            'POST',

            '/api/iblock/block/',

            [],

            [],

            $headers,

            json_encode([

                'code' => 'news_block',

                'name' => 'News Block',

                'sort' => 100,

                'active' => true,

                'type_id' => $typeId,

            ], JSON_THROW_ON_ERROR)

        );

        self::assertResponseStatusCodeSame(201);

        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertGreaterThan(0, $blockId);



        $client->request(

            'POST',

            '/api/iblock/element/',

            [],

            [],

            $headers,

            json_encode([

                'code' => 'news_item_1',

                'name' => 'News Item 1',

                'sort' => 100,

                'active' => true,

                'block_id' => $blockId,

            ], JSON_THROW_ON_ERROR)

        );

        self::assertResponseStatusCodeSame(201);

        $elementId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertGreaterThan(0, $elementId);



        $client->request(

            'POST',

            '/api/iblock/element/list',

            [],

            [],

            $headers,

            json_encode([

                't' => 'list',

                'limit' => 10,

                'offset' => 1,

                'sortBy' => [['key' => 'sort', 'order' => 'ASC']],

                'filters' => ['block_id' => $blockId, 'active' => true],

            ], JSON_THROW_ON_ERROR)

        );

        self::assertResponseIsSuccessful();
        self::assertNotNull($client->getResponse()->headers->get('Content-Range'));



        /** @var array<int, array<string, mixed>> $listPayload */

        $listPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(1, $listPayload);

        self::assertSame($elementId, $listPayload[0]['id']);



        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);

        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $detailPayload */

        $detailPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('news_item_1', $detailPayload['code']);

        self::assertSame($blockId, $detailPayload['block_id']);



        $client->request(

            'PUT',

            '/api/iblock/element/'.$elementId,

            [],

            [],

            $headers,

            json_encode([

                'name' => 'News Item Updated',

                'code' => 'news_item_1',

                'block_id' => $blockId,

            ], JSON_THROW_ON_ERROR)

        );

        self::assertResponseIsSuccessful();



        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);

        self::assertResponseIsSuccessful();

        $updatedPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('News Item Updated', $updatedPayload['name']);



        $client->request('DELETE', '/api/iblock/element/'.$elementId, [], [], $headers);

        self::assertResponseIsSuccessful();



        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);

        self::assertResponseStatusCodeSame(404);

    }



    public function testElementListFilterByName(): void

    {

        $client = static::createClient();

        $this->prepareIBlockDatabase($client);



        $loginPayload = $this->login($client);

        $headers = $this->authHeaders($loginPayload['token']);



        $client->request(

            'POST',

            '/api/iblock/type/',

            [],

            [],

            $headers,

            json_encode(['code' => 'content_type', 'name' => 'Content'], JSON_THROW_ON_ERROR)

        );

        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);



        $client->request(

            'POST',

            '/api/iblock/block/',

            [],

            [],

            $headers,

            json_encode(['code' => 'content_block', 'name' => 'Content Block', 'type_id' => $typeId], JSON_THROW_ON_ERROR)

        );

        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);



        foreach (['Alpha item', 'Beta item'] as $index => $name) {

            $client->request(

                'POST',

                '/api/iblock/element/',

                [],

                [],

                $headers,

                json_encode([

                    'code' => 'item_'.$index,

                    'name' => $name,

                    'block_id' => $blockId,

                ], JSON_THROW_ON_ERROR)

            );

            self::assertResponseStatusCodeSame(201);

        }



        $client->request(

            'POST',

            '/api/iblock/element/list',

            [],

            [],

            $headers,

            json_encode([

                'limit' => 10,

                'offset' => 1,

                'filters' => ['block_id' => $blockId, 'name' => 'Alpha'],

            ], JSON_THROW_ON_ERROR)

        );

        self::assertResponseIsSuccessful();

        $items = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(1, $items);

        self::assertSame('Alpha item', $items[0]['name']);

    }

}



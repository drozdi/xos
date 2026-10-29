<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use IBlock\Entity\Block;
use IBlock\Entity\Element;
use IBlock\Entity\ElementPropertyValue;
use IBlock\Entity\ElementShare;
use IBlock\Entity\Property;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Entity\Section;
use IBlock\Entity\SectionElement;
use IBlock\Entity\SectionProperty;
use IBlock\Entity\Type;
use Main\Entity\File as MainFile;
use Main\Service\FileManager;

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
            $entityManager->getClassMetadata(SectionProperty::class),
            $entityManager->getClassMetadata(SectionElement::class),
            $entityManager->getClassMetadata(Element::class),
            $entityManager->getClassMetadata(ElementPropertyValue::class),
            $entityManager->getClassMetadata(ElementShare::class),
            $entityManager->getClassMetadata(MainFile::class),
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
            '/api/iblock/type',
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
            '/api/iblock/block',
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
            '/api/iblock/element',
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
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 'content_type', 'name' => 'Content'], JSON_THROW_ON_ERROR)
        );
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'content_block', 'name' => 'Content Block', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        foreach (['Alpha item', 'Beta item'] as $index => $name) {
            $client->request(
                'POST',
                '/api/iblock/element',
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

    public function testElementPropertyValuesAndFilter(): void
    {
        $client = static::createClient();
        $this->prepareIBlockDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 'catalog_type', 'name' => 'Catalog'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'catalog_block', 'name' => 'Catalog Block', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'COLOR',
                'name' => 'Color',
                'field_type' => 'L',
                'multiple' => true,
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $propertyId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertGreaterThan(0, $propertyId);

        $client->request('GET', '/api/iblock/property/'.$propertyId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $propertyDetail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($blockId, $propertyDetail['block_id']);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'WEIGHT',
                'name' => 'Weight',
                'field_type' => 'N',
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'SKU',
                'name' => 'SKU',
                'field_type' => 'S',
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/iblock/property-enum',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'RED',
                'name' => 'Red',
                'property_id' => $propertyId,
                'sort' => 100,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $enumId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertGreaterThan(0, $enumId);

        $client->request(
            'POST',
            '/api/iblock/property-enum',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'BLUE',
                'name' => 'Blue',
                'property_id' => $propertyId,
                'sort' => 200,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blueEnumId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'product_red',
                'name' => 'Red Product',
                'block_id' => $blockId,
                'PROPERTY_VALUES' => [
                    'COLOR' => ['RED', 'BLUE'],
                    'WEIGHT' => 12.5,
                    'SKU' => 'SKU-RED-1',
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $elementId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'product_blue',
                'name' => 'Blue Product',
                'block_id' => $blockId,
                'PROPERTY_VALUES' => ['COLOR' => 'BLUE'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $detail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('PROPERTY_VALUES', $detail);
        self::assertSame([$enumId, $blueEnumId], $detail['PROPERTY_VALUES']['COLOR']);
        self::assertSame(12.5, $detail['PROPERTY_VALUES']['WEIGHT']);
        self::assertSame('SKU-RED-1', $detail['PROPERTY_VALUES']['SKU']);

        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $rows = $em->getRepository(ElementPropertyValue::class)->findBy(['element' => $elementId]);
        $colorRows = array_values(array_filter(
            $rows,
            static fn (ElementPropertyValue $row): bool => 'COLOR' === $row->getProperty()?->getCode(),
        ));
        self::assertCount(1, $colorRows);
        self::assertCount(2, $colorRows[0]->getValueL());
        $weightRows = array_values(array_filter(
            $rows,
            static fn (ElementPropertyValue $row): bool => 'WEIGHT' === $row->getProperty()?->getCode(),
        ));
        self::assertCount(1, $weightRows);
        self::assertSame(12.5, $weightRows[0]->getValueN());
        self::assertSame('12.5', $weightRows[0]->getValueS());
        $skuRows = array_values(array_filter(
            $rows,
            static fn (ElementPropertyValue $row): bool => 'SKU' === $row->getProperty()?->getCode(),
        ));
        self::assertCount(1, $skuRows);
        self::assertSame('SKU-RED-1', $skuRows[0]->getValueS());

        $client->request(
            'POST',
            '/api/iblock/element/list',
            [],
            [],
            $headers,
            json_encode([
                'limit' => 10,
                'offset' => 1,
                'filters' => [
                    'block_id' => $blockId,
                    'PROPERTY_COLOR' => 'RED',
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $filtered = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $filtered);
        self::assertSame($elementId, $filtered[0]['id']);
        self::assertSame('Red Product', $filtered[0]['name']);

        $client->request(
            'POST',
            '/api/iblock/element/list',
            [],
            [],
            $headers,
            json_encode([
                'limit' => 10,
                'offset' => 1,
                'filters' => [
                    'block_id' => $blockId,
                    'PROPERTY_SKU' => 'SKU-RED-1',
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $filteredSku = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $filteredSku);
        self::assertSame($elementId, $filteredSku[0]['id']);
    }

    public function testSectionPropertyFilterSettings(): void
    {
        $client = static::createClient();
        $this->prepareIBlockDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 'shop_type', 'name' => 'Shop'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'shop_block', 'name' => 'Shop Block', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/section',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'shop_section',
                'name' => 'Shop Section',
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $sectionId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'BRAND',
                'name' => 'Brand',
                'field_type' => 'L',
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $propertyId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/section-property',
            [],
            [],
            $headers,
            json_encode([
                'section_id' => $sectionId,
                'property_id' => $propertyId,
                'smart_filter' => true,
                'display_type' => 'F',
                'display_expanded' => true,
                'sort' => 50,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $spId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertGreaterThan(0, $spId);

        $client->request('GET', '/api/iblock/section-property/'.$spId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $spDetail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($sectionId, $spDetail['section_id']);
        self::assertSame($propertyId, $spDetail['property_id']);
        self::assertSame($blockId, $spDetail['block_id']);
        self::assertTrue($spDetail['smart_filter']);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'SIZE',
                'name' => 'Size',
                'field_type' => 'S',
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $sizePropertyId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/section-property',
            [],
            [],
            $headers,
            json_encode([
                'section_id' => $sectionId,
                'property_id' => $sizePropertyId,
                'smart_filter' => false,
                'active' => true,
                'sort' => 200,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request('GET', '/api/iblock/section/'.$sectionId.'/filter', [], [], $headers);
        self::assertResponseIsSuccessful();
        $filterSettings = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $filterSettings);
        self::assertSame('BRAND', $filterSettings[0]['code']);
        self::assertSame('Brand', $filterSettings[0]['name']);
        self::assertSame('L', $filterSettings[0]['field_type']);
        self::assertSame('F', $filterSettings[0]['display_type']);
        self::assertTrue($filterSettings[0]['display_expanded']);
        self::assertSame(50, $filterSettings[0]['sort']);
    }

    public function testPropertyTypesFEGAndLinkIblock(): void
    {
        $client = static::createClient();
        $this->prepareIBlockDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 'link_type', 'name' => 'Link Type'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'owner_block', 'name' => 'Owner', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $ownerBlockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'target_block', 'name' => 'Target', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $targetBlockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'RELATED',
                'name' => 'Related',
                'field_type' => 'E',
                'block_id' => $ownerBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'RELATED',
                'name' => 'Related',
                'field_type' => 'E',
                'block_id' => $ownerBlockId,
                'link_iblock_id' => $targetBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'FOLDER',
                'name' => 'Folder',
                'field_type' => 'G',
                'block_id' => $ownerBlockId,
                'link_iblock_id' => $targetBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'DOC',
                'name' => 'Document',
                'field_type' => 'F',
                'block_id' => $ownerBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/iblock/section',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'target_sec',
                'name' => 'Target Section',
                'block_id' => $targetBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $sectionId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'target_el',
                'name' => 'Target Element',
                'block_id' => $targetBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $targetElementId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'wrong_el',
                'name' => 'Wrong Element',
                'block_id' => $ownerBlockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $wrongElementId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $tmp = tempnam(sys_get_temp_dir(), 'iblock');
        self::assertNotFalse($tmp);
        file_put_contents($tmp, 'iblock file body');
        /** @var FileManager $fileManager */
        $fileManager = $client->getContainer()->get(FileManager::class);
        $file = $fileManager->importFromLocalPath($tmp, 'iblock', 'props', 'doc.txt');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();
        $fileId = (int) $file->getId();
        @unlink($tmp);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'owner_el',
                'name' => 'Owner Element',
                'block_id' => $ownerBlockId,
                'PROPERTY_VALUES' => [
                    'RELATED' => $wrongElementId,
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'owner_el',
                'name' => 'Owner Element',
                'block_id' => $ownerBlockId,
                'PROPERTY_VALUES' => [
                    'RELATED' => $targetElementId,
                    'FOLDER' => $sectionId,
                    'DOC' => $fileId,
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $ownerElementId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/iblock/element/'.$ownerElementId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $detail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($targetElementId, $detail['PROPERTY_VALUES']['RELATED']['id']);
        self::assertSame($sectionId, $detail['PROPERTY_VALUES']['FOLDER']['id']);
        self::assertSame($fileId, $detail['PROPERTY_VALUES']['DOC']['id']);
        self::assertSame('doc.txt', $detail['PROPERTY_VALUES']['DOC']['name']);

        $client->request(
            'POST',
            '/api/iblock/element/list',
            [],
            [],
            $headers,
            json_encode([
                'limit' => 10,
                'offset' => 1,
                'filters' => [
                    'block_id' => $ownerBlockId,
                    'PROPERTY_RELATED' => $targetElementId,
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $items = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $items);
        self::assertSame($ownerElementId, $items[0]['id']);
    }

    public function testPropertyRequiresBlockId(): void
    {
        $client = static::createClient();
        $this->prepareIBlockDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 't1', 'name' => 'T1'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'b1', 'name' => 'B1', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'NO_BLOCK',
                'name' => 'No Block',
                'field_type' => 'S',
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'WITH_BLOCK',
                'name' => 'With Block',
                'field_type' => 'S',
                'block_id' => $blockId,
                'type_id' => $typeId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $propertyId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/iblock/property/'.$propertyId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $detail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($blockId, $detail['block_id']);
        self::assertArrayNotHasKey('type_id', $detail);
    }

    public function testSectionElementBindTreeAndFilterInheritance(): void
    {
        $client = static::createClient();
        $this->prepareIBlockDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 'se_type', 'name' => 'SE Type'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'se_block',
                'name' => 'SE Block',
                'type_id' => $typeId,
                'sections' => true,
                'property' => true,
                'section_mode' => 'bind',
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/iblock/block/'.$blockId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $blockDetail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('bind', $blockDetail['section_mode']);

        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'COLOR',
                'name' => 'Color',
                'field_type' => 'S',
                'block_id' => $blockId,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/iblock/section',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'root_sec',
                'name' => 'Root',
                'block_id' => $blockId,
                'element_filter' => ['PROPERTY_COLOR' => 'red'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $rootId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/section',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'child_sec',
                'name' => 'Child',
                'block_id' => $blockId,
                'parent_id' => $rootId,
                'element_filter' => ['PROPERTY_COLOR' => 'blue'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $childId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/iblock/section/'.$childId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $childDetail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['PROPERTY_COLOR' => 'blue'], $childDetail['element_filter']);
        self::assertSame(['PROPERTY_COLOR' => 'blue'], $childDetail['inherited_element_filter']);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'el_multi',
                'name' => 'Multi',
                'block_id' => $blockId,
                'section_ids' => [$rootId, $childId],
                'PROPERTY_VALUES' => ['COLOR' => 'green'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $multiId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/iblock/element/'.$multiId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $multiDetail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($rootId, $multiDetail['section_id']);
        self::assertSame([$rootId, $childId], $multiDetail['section_ids']);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'el_child_only',
                'name' => 'Child Only',
                'block_id' => $blockId,
                'section_ids' => [$childId],
                'PROPERTY_VALUES' => ['COLOR' => 'yellow'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $childOnlyId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'el_blue',
                'name' => 'Blue Via Filter',
                'block_id' => $blockId,
                'PROPERTY_VALUES' => ['COLOR' => 'blue'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blueId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        // bind: root sees only elements bound to root
        $client->request(
            'POST',
            '/api/iblock/element/list',
            [],
            [],
            $headers,
            json_encode([
                't' => 'list',
                'limit' => -1,
                'offset' => 1,
                'filters' => ['section_id' => $rootId],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $bindRoot = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $bindRootIds = array_column($bindRoot, 'id');
        self::assertContains($multiId, $bindRootIds);
        self::assertNotContains($childOnlyId, $bindRootIds);

        // tree: root includes child section binds
        $client->request(
            'PUT',
            '/api/iblock/block/'.$blockId,
            [],
            [],
            $headers,
            json_encode(['section_mode' => 'tree'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/iblock/section/'.$rootId.'/elements',
            [],
            [],
            $headers,
            json_encode(['t' => 'list', 'limit' => -1, 'offset' => 1, 'filters' => []], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $treeRoot = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $treeRootIds = array_column($treeRoot, 'id');
        self::assertContains($multiId, $treeRootIds);
        self::assertContains($childOnlyId, $treeRootIds);

        // filter: inherited COLOR=blue on child
        $client->request(
            'PUT',
            '/api/iblock/block/'.$blockId,
            [],
            [],
            $headers,
            json_encode(['section_mode' => 'filter'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/iblock/element/list',
            [],
            [],
            $headers,
            json_encode([
                't' => 'list',
                'limit' => -1,
                'offset' => 1,
                'filters' => ['section_id' => $childId],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $filterChild = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $filterChildIds = array_column($filterChild, 'id');
        self::assertContains($blueId, $filterChildIds);
        self::assertNotContains($multiId, $filterChildIds);

        // bind_filter: union of tree and filter
        $client->request(
            'PUT',
            '/api/iblock/block/'.$blockId,
            [],
            [],
            $headers,
            json_encode(['section_mode' => 'bind_filter'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/iblock/element/list',
            [],
            [],
            $headers,
            json_encode([
                't' => 'list',
                'limit' => -1,
                'offset' => 1,
                'filters' => ['section_id' => $childId],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $union = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $unionIds = array_column($union, 'id');
        self::assertContains($multiId, $unionIds);
        self::assertContains($childOnlyId, $unionIds);
        self::assertContains($blueId, $unionIds);
    }

    public function testPrototypePropertyValues(): void
    {
        $client = static::createClient();
        $this->prepareIBlockDatabase($client);
        $headers = $this->authHeaders($this->login($client)['token']);

        $client->request(
            'POST',
            '/api/iblock/type',
            [],
            [],
            $headers,
            json_encode(['code' => 'proto_type', 'name' => 'Proto Type'], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $typeId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/iblock/block',
            [],
            [],
            $headers,
            json_encode(['code' => 'proto_block', 'name' => 'Proto Block', 'type_id' => $typeId], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $blockId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $specId = $this->createProperty($client, $headers, [
            'code' => 'SPEC',
            'name' => 'Spec',
            'field_type' => 'P',
            'required' => true,
            'block_id' => $blockId,
        ]);
        $this->createProperty($client, $headers, [
            'code' => 'TITLE',
            'name' => 'Inner title',
            'field_type' => 'S',
            'block_id' => $blockId,
            'parent_id' => $specId,
        ]);
        $this->createProperty($client, $headers, [
            'code' => 'QTY',
            'name' => 'Qty',
            'field_type' => 'N',
            'block_id' => $blockId,
            'parent_id' => $specId,
        ]);
        $this->createProperty($client, $headers, [
            'code' => 'TITLE',
            'name' => 'Root title',
            'field_type' => 'S',
            'block_id' => $blockId,
        ]);
        $optId = $this->createProperty($client, $headers, [
            'code' => 'OPT',
            'name' => 'Optional',
            'field_type' => 'P',
            'required' => false,
            'block_id' => $blockId,
        ]);
        $this->createProperty($client, $headers, [
            'code' => 'NOTE',
            'name' => 'Note',
            'field_type' => 'S',
            'block_id' => $blockId,
            'parent_id' => $optId,
        ]);

        $client->request(
            'POST',
            '/api/iblock/property/list',
            [],
            [],
            $headers,
            json_encode([
                't' => 'list',
                'limit' => -1,
                'offset' => 1,
                'filters' => ['block_id' => $blockId],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();
        $listed = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $codes = array_column($listed, 'code');
        sort($codes);
        self::assertSame(['OPT', 'SPEC', 'TITLE'], $codes);

        $client->request('GET', '/api/iblock/property/'.$specId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $spec = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $childCodes = array_column($spec['children'], 'code');
        sort($childCodes);
        self::assertSame(['QTY', 'TITLE'], $childCodes);

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'incomplete',
                'name' => 'Incomplete',
                'block_id' => $blockId,
                'PROPERTY_VALUES' => [
                    'SPEC' => ['TITLE' => 'only title'],
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);
        self::assertStringContainsString('QTY', (string) $client->getResponse()->getContent());

        $client->request(
            'POST',
            '/api/iblock/element',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'complete',
                'name' => 'Complete',
                'block_id' => $blockId,
                'PROPERTY_VALUES' => [
                    'TITLE' => 'root title',
                    'SPEC' => ['TITLE' => 'inner', 'QTY' => 2],
                    'OPT' => [],
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201);
        $elementId = (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $detail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('root title', $detail['PROPERTY_VALUES']['TITLE']);
        self::assertSame('inner', $detail['PROPERTY_VALUES']['SPEC']['TITLE']);
        self::assertEquals(2, $detail['PROPERTY_VALUES']['SPEC']['QTY']);
        self::assertArrayNotHasKey('OPT', $detail['PROPERTY_VALUES']);

        $client->request(
            'PUT',
            '/api/iblock/element/'.$elementId,
            [],
            [],
            $headers,
            json_encode([
                'PROPERTY_VALUES' => [
                    'OPT' => ['NOTE' => 'hello'],
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $withNote = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('hello', $withNote['PROPERTY_VALUES']['OPT']['NOTE']);
        self::assertSame('inner', $withNote['PROPERTY_VALUES']['SPEC']['TITLE']);

        $client->request(
            'PUT',
            '/api/iblock/element/'.$elementId,
            [],
            [],
            $headers,
            json_encode([
                'PROPERTY_VALUES' => [
                    'OPT' => ['NOTE' => ''],
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/iblock/element/'.$elementId, [], [], $headers);
        self::assertResponseIsSuccessful();
        $cleared = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayNotHasKey('OPT', $cleared['PROPERTY_VALUES']);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function createProperty($client, array $headers, array $payload): int
    {
        $client->request(
            'POST',
            '/api/iblock/property',
            [],
            [],
            $headers,
            json_encode($payload, JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(201, (string) $client->getResponse()->getContent());

        return (int) json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}

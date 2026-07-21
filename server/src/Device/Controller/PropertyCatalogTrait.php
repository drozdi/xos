<?php

namespace Device\Controller;

use Device\Repository\PropertyRepository;
use Device\Service\DeviceManager;
use Symfony\Component\HttpFoundation\JsonResponse;

trait PropertyCatalogTrait {
    protected function propertyCatalogItems (PropertyRepository $PropertyRepository): array {
        $items = [];
        foreach ($PropertyRepository->getProperties() as $property) {
            $items[] = [
                'value' => $property->getId(),
                'label' => $property->getName(),
                'sublabel' => $property->getCode(),
            ];
        }
        return $items;
    }

    protected function propertyCatalogResponse (PropertyRepository $PropertyRepository): JsonResponse {
        return $this->json($this->propertyCatalogItems($PropertyRepository));
    }

    protected function propertyTemplateResponse (int $id, DeviceManager $dm): JsonResponse {
        $property = $dm->property($id);
        if (!(int)$property->getId()) {
            throw $this->createNotFoundException('Property not found');
        }
        return $this->json(PropertyArrayBuilder::fromProperty($property));
    }
}

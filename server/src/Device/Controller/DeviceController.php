<?php

namespace Device\Controller;

use App\Attribute\Access;
use Device\Service\DeviceManager;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;

use Device\Entity\Type;
use Device\Entity\Property;
use Device\Repository\DeviceRepository;
use Device\Repository\TypeRepository;
use Device\Repository\PropertyRepository;
use Device\Repository\PropertyEnumRepository;
use Device\Repository\Device\LocationRepository;

use Main\Service\FileManager;

#[Route('/device/device')]
#[Access('device.device')]
class DeviceController extends AbstractController {
    #[Route('/filter', methods: ['GET'])]
    #[Access('can_read')]
    public function filter (TypeRepository $TypeRepository): JsonResponse {
        $items = [];
        foreach ($TypeRepository->getTypes() as $type) {
            $items[] = [
                'label' => $type->getName(),
                'sublabel' => $type->getCode(),
                'value' => $type->getId(),
                'type' => $type->isRoot()? "subheader": ""
            ];
            if ($type->isRoot()) {
                foreach ($type->getChildren() as $subType) {
                    $items[] = [
                        'label' => $subType->getName(),
                        'sublabel' => $subType->getCode(),
                        'value' => $subType->getId(),
                    ];
                }
                $items[] = ['type'=> "divider"];
            }
        }

        return $this->json($items);
    }

    #[Route('/select', methods: ['POST'])]
    #[Access('can_read')]
    public function select (Request $request, DeviceRepository $DeviceRepository, LocationRepository $LocationRepository): JsonResponse {
        /*throw $this->createNotFoundException(
            'No product found for id'
        );//*/
        $req = array_merge([
            't' => "list",
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]],
            'filters' => []
        ], $request->toArray());
        if (empty($req['sortBy'])) {
            $req['sortBy'] =[[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]];
        }
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $DeviceRepository->cnt($req['filters']);
        $query = $DeviceRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $t) {
            $items[] = array(
                'value' => $t->getId(),
                'label' => $t->getName(),
                'sublabel' => $t->getCode(),
            );
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, DeviceRepository $DeviceRepository, LocationRepository $LocationRepository): JsonResponse {
        /*throw $this->createNotFoundException(
            'No product found for id'
        );//*/
        $req = array_merge([
            't' => "list",
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]],
            'filters' => []
        ], $request->toArray());
        if (empty($req['sortBy'])) {
            $req['sortBy'] =[[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]];
        }
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $DeviceRepository->cnt($req['filters']);
        $query = $DeviceRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $device) {
            $loc = "";
            if ($location = $LocationRepository->findOneBy(array(
                'device' => $device
            ), array(
                'date' => "DESC",
                'id' => "DESC"
            ))) {
                $loc = $location->getPlace().' ('.$location->getResponsible().')';
            }
            $items[] = array(
                'id' => $device->getId(),
                'code' => $device->getCode(),
                'location' => $loc,
                'inNo' => $device->getAccounting()? $device->getAccounting()->getInNo(): null,
                'dateCreated' => $device->getDateCreated()->format("d.m.Y H:i").($device->getCreatedBy()? " (".$device->getCreatedBy()->getLogin().")": ''),
                'xTimestamp' => $device->getXTimestamp()->format("d.m.Y H:i").($device->getModifiedBy()? " (".$device->getModifiedBy()->getLogin().")": ''),
            );
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }


    #[Route('/property/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function property ($id, PropertyRepository $PropertyRepository, DeviceManager $dm) {
        $property = $PropertyRepository->find($id);
        $properties = [];
        $ii = 1;
        foreach ($property->getChildren() as $child) {
            $ii++;
            $properties['np'.$ii] = $dm->getPropertyValue($child, 'np'.$ii);
        }
        $item = $dm->getPropertyValue($property);
        $item['properties'] = $properties;

        return $this->json($item);
    }

    #[Route('/properties/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function properties ($id, TypeRepository $TypeRepository) {
        $type = $TypeRepository->find($id);
        $items = [];
        foreach ($type? $type->getProperties(): [] as $property) {
            $items[] = [
                'value' => $property->getId(),
                'label' => $property->getName(),
                'sublabel' => $property->getCode()
            ];
        }
        return $this->json($items);
    }

    #[Route('/upload', methods: ['POST'])]
    #[Access('can_read')]
    public function upload (Request $request, FileManager $fm, DeviceManager $dm, #[CurrentUser] User $user): JsonResponse {
        $device = $dm->device((int)$request->get('id'));
        foreach ($fm->upload('device[images]', 'device') as $image) {
            $device->addImage($image);
        }
        $dm->getEntityManager()->flush();
        return $this->json([]);
    }


    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, DeviceManager $dm, #[CurrentUser] User $user): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $device = $dm->device($req['id'], $req);
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($device->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, DeviceManager $dm): JsonResponse {
        $device = $dm->device($id);
        $arLocations = [];
        foreach ($device->getLocations()??[] as $location) {
            $arLocations[$location->getId()] = [
                'id' => $location->getId(),
                'date' => $location->getDate("Y.m.d"),
                'responsible' => $location->getResponsible(),
                'place' => $location->getPlace(),
            ];
        }
        $arRepairs = [];
        foreach ($device->getRepairs()??[] as $repair) {
            $arRepairs[$repair->getId()] = [
                'id' => $repair->getId(),
                'putInto' => $repair->getPutInto("Y.m.d"),
                'receivedFrom' => $repair->getReceivedFrom("Y.m.d"),
                'repairman' => $repair->getRepairman(),
                'reason' => $repair->getReason(),
                'description' => $repair->getDescription(),
                'closed' => $repair->isClosed()
            ];
        }
        $arProperties = [];
        foreach ($device->getProperties()??[] as $value) {
            $item = $dm->getPropertyValue($value);
            if ($value && $value->getSubDevice()) {
                $item['sn'] = $value->getSubDevice()->getSn();
                $item['subDeviceId'] = $value->getSubDevice()->getId();
                $item['properties'] = [];
                foreach ($value->getSubDevice()->getProperties() as $subValue) {
                    $item['properties'][$subValue->getId()] = $dm->getPropertyValue($subValue);
                }
            }
            $arProperties[$value->getId()] = $item;
        }
        $arLicenses = [];
        foreach ($device->getLicenses()??[] as $licensesKey) {
            $arLicenses[$licensesKey->getId()] = [
                'id' => $licensesKey->getId(),
                'type' => $licensesKey->getSoftware()->getType()->getId(),
                'type_name' => $licensesKey->getSoftware()->getType()->getName(),
                'software' => $licensesKey->getSoftware()->getId(),
                'software_name' => $licensesKey->getSoftware()->getName(),
                'licenseSoftware' => $licensesKey->getLicenseSoftware()->getId(),
                'licenseSoftware_name' => $licensesKey->getName(),
                'key' => $licensesKey->getKey()->getId(),
                'key_name' => $licensesKey->getValue()
            ];
        }

        $arImages = [];
        foreach ($device->getImages()??[] as $image) {
            $arImages[$image->getId()] = [
                'id' => $image->getId(),
                'src' => $image->getFileSRC(),
                'name' => $image->getOriginalName(),
            ];
        }

        return $this->json([
            'id' => $device->getId(),
            'dateCreated' => $device->getDateCreated("Y.m.d H:i"),
            'createdBy' => $device->getCreatedBy()? $device->getCreatedBy()->getAlias(): '',
            'xTimestamp' => $device->getXTimestamp("Y.m.d H:i"),
            'modifiedBy' => $device->getModifiedBy()? $device->getModifiedBy()->getAlias(): '',
            'name' => $device->getName(),
            'code' => $device->getCode(false),
            'title' => $device->getCode(),
            'typeId' => $device->getType()? $device->getType()->getId(): 0,
            'sort' => $device->getSort(),
            'description' => $device->getDescription(),
            'log' => $device->getLog(),
            'accounting' => [
                'inNo' => $device->getAccounting()? $device->getAccounting()->getInNo(): '',
                'invoice' => $device->getAccounting()? $device->getAccounting()->getInvoice(): '',
                'dateInvoice' => $device->getAccounting()? $device->getAccounting()->getDateInvoice("Y.m.d"): '',
                'dateDiscarded' => $device->getAccounting()? $device->getAccounting()->getDateDiscarded("Y.m.d"): '',
                'discarded' => $device->getAccounting()? $device->getAccounting()->isDiscarded(): '',
                'name' => $device->getAccounting()? $device->getAccounting()->getName(): '',
                'isChild' => $device->getAccounting() && $device->getAccounting()->isChild(),
            ],
            'locations' => $arLocations,
            'repairs' => $arRepairs,
            'properties' => $arProperties,
            'licenses' => $arLicenses,
            'images' => $arImages
        ]);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, DeviceManager $dm, FileManager $fm, #[CurrentUser] User $user): JsonResponse {
        $req = $request->toArray();
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $device = $dm->device($id, $req);

            $req['locations'] = $req['locations'] ?? [];
            foreach ($req['locations'] as $id => $arLocation) {
                if ((int)$id === 0) {
                    $dm->deviceLocation($device, $arLocation);
                }
            }
            $req['repairs'] = $req['repairs'] ?? [];
            foreach ($req['repairs'] as $id => $arRepair) {
                $dm->deviceRepair($device, array_merge($arRepair, array(
                    'id' => $id
                )));
            }

            $req['licenses'] = $req['licenses'] ?? [];
            foreach ($device->getLicenses() as $license) {
                if ($arLicense = $req['licenses'][$license->getId()]??null) {

                } else {
                    $dm->getEntityManager()->remove($license);
                    $device->removeLicense($license);
                }
                unset($req['licenses'][$license->getId()]);
            }

            foreach ($req['licenses'] as $arLicense) {
                $dm->deviceLicense($device, $arLicense);
            }

            $device->setModifiedBy($user);

            $arAccounting = $req['accounting']??[];
            $accounting = $dm->accounting($device->getAccounting(), array_merge($arAccounting, array(
                'device' => $device
            )));
            foreach ($device->getChildren() as $subDevice) {
                if (!($subAccounting = $subDevice->getAccounting())) {
                    $subAccounting = $accounting->newChild();
                    $subDevice->setAccounting($subAccounting);
                }
                if (!(int)$subAccounting->getId()) {
                    $dm->getEntityManager()->persist($subAccounting);
                }
            }

            $req['images'] = $req['images'] ?? [];
            foreach ($device->getImages() as $image) {
                if (!isset($req['images'][$image->getId()])) {
                    $device->removeImage($image);
                    $fm->remove($image);
                }
            }

            $dm->getEntityManager()->flush();

            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            throw $e;
        }
        return $this->json($device->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, DeviceRepository $DeviceRepository): JsonResponse {
        $device = $DeviceRepository->find($id);
        $arDevice = [
            'id' => $device->getId(),
            'name' => $device->getName(),
            'code' => $device->getCode(),
        ];
        $DeviceRepository->remove($device, true);
        return $this->json($arDevice);
    }
}
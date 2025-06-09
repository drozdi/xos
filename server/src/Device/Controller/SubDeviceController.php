<?php

namespace Device\Controller;

use App\Attribute\Access;

use Device\Entity\Type;
use Device\Entity\Device;

use Device\Repository\TypeRepository;
use Device\Repository\DeviceRepository;
use Device\Repository\Device\PropertyRepository as DevicePropertyRepository;

use Device\Service\DeviceManager;

use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/device/subDevices')]
#[Access('device.subDevice')]
class SubDeviceController extends AbstractController {
    #[Route('/filter', methods: ['GET'])]
    #[Access('can_read')]
    public function filter (TypeRepository $TypeRepository): JsonResponse {
        $items = [];
        foreach ($TypeRepository->getComponents() as $type) {
            $items[] = [
                'label' => $type->getName(),
                'sublabel' => $type->getCode(),
                'value' => $type->getId(),
            ];
        }
        return $this->json($items);
    }

    #[Route('/form/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function formProperties (?Type $type, DeviceManager $dm): JsonResponse {
        if (!$type) {
            return [];
        }
        $res = [];
        $i = 0;
        foreach ($type->getProperties()??[] as $property) {
            $i++;
            $res['n'.$i] = $dm->getPropertyValue($property, 'n'.$i);
        }
        return $this->json($res);
    }

    #[Route('/attach/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function filterAttach (?Type $type): JsonResponse {
        return $this->json([
            'device' => [
                'type' => array_map(function ($type) {
                    return $type->getId();
                }, $type->getProperty()->getTypes()->toArray()),
            ],
            'discarded' => false
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, DeviceManager $dm, DevicePropertyRepository $DevicePropertyRepository): JsonResponse {
        $device = $dm->device($id);
        $arHistories = [];
        foreach ($device->getHistories()??[] as $location) {
            $arHistories[$location->getId()] = [
                'id' => $location->getId(),
                'parent_id' => $location->getParent()->getId(),
                'date' => $location->getDatePlacement("Y.m.d"),
                'place' => $location->getParent()->getCode(),
            ];
        }
        $i = 0;
        $arProperties = [];
        foreach ($device->getType()?$device->getType()->getProperties(): [] as $property) {
            if ($value = $DevicePropertyRepository->findOneBy([
                'device' => $device,
                'property' => $property
            ])) {
                $item = $dm->getPropertyValue($value, 'np'.(++$i));
            } else {
                $item = $dm->getPropertyValue($property, 'np'.(++$i));
            }
            $arProperties[$item['id']] = $item;
        }

        return $this->json([
            'id' => $device->getId(),
            'dateCreated' => $device->getDateCreated("Y.m.d H:i"),
            'createdBy' => $device->getCreatedBy()? $device->getCreatedBy()->getAlias(): '',
            'xTimestamp' => $device->getXTimestamp("Y.m.d H:i"),
            'modifiedBy' => $device->getModifiedBy()? $device->getModifiedBy()->getAlias(): '',
            'name' => $device->getName(),
            'title' => $device->getName(),
            'type_id' => $device->getType()? $device->getType()->getId(): 0,
            'sort' => $device->getSort(),
            'description' => $device->getDescription(),
            'log' => $device->getLog(),
            'accounting' => [
                'id' => $device->getAccounting()? $device->getAccounting()->getId(): '',
                'inNo' => $device->getAccounting()? $device->getAccounting()->getInNo(): '',
                'isChild' => $device->getAccounting() && $device->getAccounting()->isChild(),
                'invoice' => $device->getAccounting()? $device->getAccounting()->getInvoice(): '',
                'dateInvoice' => $device->getAccounting()? $device->getAccounting()->getDateInvoice("Y.m.d"): '',
                'dateDiscarded' => $device->getAccounting()? $device->getAccounting()->getDateDiscarded("Y.m.d"): '',
                'discarded' => $device->getAccounting()? $device->getAccounting()->isDiscarded(): '',
                'name' => $device->getAccounting()? $device->getAccounting()->getName(): '',
                'parent_id' => $device->getAccounting() && $device->getAccounting()->getParent()? $device->getAccounting()->getParent()->getId(): null,
            ],
            'histories' => $arHistories,
            'properties' => $arProperties,
        ]);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, DeviceManager $dm, #[CurrentUser] User $user): JsonResponse {
        $req = $request->toArray();
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $device = $dm->device($id, array_merge($req, [
                'modifiedBy' => $user
            ]));
            $dm->accounting($device->getAccounting(), array_merge($req['accounting']??[], array(
                'device' => $device,
            )));
            $device->setModifiedBy($user);
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

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, DeviceManager $dm, #[CurrentUser] User $user): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $device = $dm->device($req['id'], array_merge($req, [

            ]));
            $dm->accounting($device->getAccounting(), array_merge($req['accounting']??[], [
                'device' => $device
            ]));
            $device->setCreatedBy($user);
            $device->setModifiedBy($user);
            $dm->getEntityManager()->flush();
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
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

    #[Route('/select', methods: ['POST'])]
    public function select (Request $request, DeviceRepository $DeviceRepository): JsonResponse {
        $req = array_merge([
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
                'title' => $t->getName(),
                'subtitle' => $t->getCode(),
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
    public function list (Request $request, DeviceRepository $DeviceRepository): JsonResponse {
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
            $loc = "Пока не привязан";
            if ($device->getParent()) {
                $loc = $device->getParent()->getCode();
            }
            $items[] = array(
                'id' => $device->getId(),
                'code' => $device->getCode(),
                'name' => $device->getName(),
                'sn' => $device->getSn(),
                'location' => $loc,
                'dateCreated' => $device->getDateCreated("Y.m.d H:i").($device->getCreatedBy()? " (".$device->getCreatedBy()->getLogin().")": ''),
                'xTimestamp' => $device->getXTimestamp("Y.m.d H:i").($device->getModifiedBy()? " (".$device->getModifiedBy()->getLogin().")": ''),
            );
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }
}
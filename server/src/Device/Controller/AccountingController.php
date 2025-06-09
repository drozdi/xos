<?php

namespace Device\Controller;

use Device\Service\DeviceManager;
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
use Device\Repository\AccountingRepository;
use Device\Repository\DeviceRepository;
use Device\Repository\TypeRepository;
use Device\Repository\PropertyRepository;
use Device\Repository\PropertyEnumRepository;
use Device\Repository\Device\LocationRepository;

use Main\Service\FileManager;

#[Route('/device/accounting')]
class AccountingController extends AbstractController {
    #[Route('/list/select', methods: ['POST'])]
    public function select (Request $request, AccountingRepository $AccountingRepository): JsonResponse {
        $req = array_merge([
            't' => "list",
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "ad.sort",
                'order' => "ASC",
            ], [
                'key' => "ad.code",
                'order' => "ASC",
            ], [
                'key' => "ad.name",
                'order' => "ASC",
            ]],
            'filters' => []
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $AccountingRepository->cnt($req['filters']);
        $query = $AccountingRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset'], 'a');
        $query = $query->getQuery();
        $items = [];
        foreach ($query->execute() as $t) {
            $items[] = [
                'value' => $t->getId(),
                'label' => $t->getDevice()->getCode(),
                'sublabel' => $t->getName(),
            ];
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }
    #[Route('/list', methods: ['POST'])]
    public function list (Request $request, AccountingRepository $AccountingRepository): JsonResponse {
        /*throw $this->createNotFoundException(
            'No product found for id'
        );//*/
        $req = array_merge([
            't' => "list",
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "ad.sort",
                'order' => "ASC",
            ], [
                'key' => "ad.code",
                'order' => "ASC",
            ], [
                'key' => "ad.name",
                'order' => "ASC",
            ]],
            'filters' => []
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $AccountingRepository->cnt($req['filters']);
        $query = $AccountingRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset'], 'a');
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'select':
                    foreach ($query->execute() as $t) {
                        $items[] = array(
                            'value' => $t->getId(),
                            'label' => $t->getDevice()->getCode(),
                            'sublabel' => $t->getName(),
                        );
                    }
                    break;
            default:
                $query->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
                foreach ($query->execute() as $t) {
                    $items[] = $t;
                }
                break;
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }
}
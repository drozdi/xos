<?php

namespace Device\Controller;

use App\Attribute\Access;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;

use Device\Entity\License;
use Device\Entity\Software;

use Device\Repository\LicenseRepository;
use Device\Repository\SoftwareRepository;
use Device\Repository\Device\LicenseRepository as DeviceLicenseRepository;
use Device\Repository\License\KeyRepository as LicenseKeyRepository;
use Device\Repository\License\SoftwareRepository as LicenseSoftwareRepository;

use Device\Service\SoftwareManager;
use Device\Service\LicenseManager;

#[Route('/device/license')]
#[Access('device.license')]
class LicenseController extends AbstractController {
    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, LicenseRepository $LicenseRepository): JsonResponse {
        $req = array_merge([
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "code",
                'order' => "ASC",
            ]],
            'filters' => [
                'type!' => 'OEM'
            ]
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $LicenseRepository->cnt($req['filters']);
        $query = $LicenseRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        foreach ($query->execute() as $license) {
            $items[] = [
                'id' => $license->getId(),
                'license_id' => $license->getId(),
                'code' => $license->getCode(),
                'type' => $license->getType(),
            ];
            foreach ($license->getSoftwares() as $software) {
                $items[] = [
                    'license_id' => $license->getId(),
                    'id' => $software->getId(),
                    'code' => sprintf('%s (%s)', $software->getName(false), $software->getCount())
                ];
            }
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, LicenseManager $lm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];

        $lm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $license = $lm->license($req['id'], $req);
            $lm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $lm->getEntityManager()->getConnection()->rollBack();
            return $this->json($lm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $lm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }

        return $this->json($license->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, LicenseManager $lm): JsonResponse {
        $license = $lm->license($id);
        $arSoft = [];
        foreach ($license->getSoftwares() as $software) {
            $arSoft[$software->getId()] = [
                'id' => $software->getId(),
                'type_id' => $software->getSoftware()->getType()->getId(),
                'software_id' => $software->getSoftware()->getId(),
                'count' => $software->getCount()
            ];
        }
        return $this->json([
            'id' => $license->getId(),
            'code' => $license->getCode(),
            'type' => $license->getType(),
            'no' => $license->getNo(),
            'autNo' => $license->getAutNo(),
            'sort' => $license->getSort(),
            'dateReal' => $license->getDateReal("d-m-Y"),
            'softwares' => $arSoft
        ]);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, LicenseManager $lm): JsonResponse {
        $req = $request->toArray();

        $lm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $license = $lm->license($id, $req);
            $lm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $lm->getEntityManager()->getConnection()->rollBack();
            return $this->json($lm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $lm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }

        return $this->json($license->getId(), Response::HTTP_CREATED);
    }

    #[Route('/remove/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, LicenseRepository $LicenseRepository): JsonResponse {
        $license = $LicenseRepository->find($id);
        $arLicense = [
            'id' => $license->getId(),
            'code' => $license->getCode(),
        ];
        $LicenseRepository->remove($license, true);
        return $this->json($arLicense);
    }
}
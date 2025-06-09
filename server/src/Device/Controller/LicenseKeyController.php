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
use Device\Repository\License\SoftwareRepository as LicenseSoftwareRepository;

use Device\Service\SoftwareManager;
use Device\Service\LicenseManager;

#[Route('/device/license/key')]
#[Access('device.license')]
class LicenseKeyController extends AbstractController {
    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, LicenseSoftwareRepository $LicenseSoftwareRepository): JsonResponse {
        /*throw $this->createNotFoundException(
            'No product found for id'
        );//*/
        $req = array_merge([
            't' => "list",
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [],
            'filters' => []
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $LicenseSoftwareRepository->cnt($req['filters']);
        $query = $LicenseSoftwareRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'list':
                foreach ($query->execute() as $license) {
                    $items[] = [
                        'id' => $license->getId(),
                        'name' => $license->getName(),
                    ];
                }
                break;
            case 'select':
                foreach ($query->execute() as $s) {
                    $items[] = array(
                        'value' => $s->getId(),
                        'label' => (string)$s->getName(),
                    );
                }
                break;
            default:
                $query->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
                foreach ($query->execute() as $s) {
                    $items[] = $s;
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

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, LicenseManager $lm, SoftwareManager $sm): JsonResponse {
        $req = $request->toArray();
        $lm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $license = $lm->licenseSoftware($id);
            $keys = (array)$req['keys']??[];
            foreach ($license->getKeys() as $key) {
                if ($arKey = $keys[$key->getId()]) {
                    if (!trim($arKey['value']) && !trim($arKey['actived'])) {
                        $lm->getEntityManager()->remove($key);
                        $license->removeKey($key);
                    } else {
                        $key->setSoftware($sm->software((int)$arKey['software_id']))
                            ->setTypeKey($arKey['typeKey'])
                            ->setValue($arKey['value'])
                            ->setActived($arKey['actived']);
                    }
                } else {
                    $lm->getEntityManager()->remove($key);
                    $license->removeKey($key);
                }
                unset($keys[$key->getId()]);
            }

            foreach ($keys as $arKey) {
                if (trim($arKey['value']) || trim($arKey['actived'])) {
                    $key = $license->newKey($sm->software((int)$arKey['software_id']))
                        ->setTypeKey($arKey['typeKey'])
                        ->setValue($arKey['value'])
                        ->setActived($arKey['actived']);
                    $lm->getEntityManager()->persist($key);
                }
            }

            $lm->getEntityManager()->flush();

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
        $license = $lm->licenseSoftware($id);
        $arKeys = [];
        foreach ($license->getKeys() as $key) {
            $arKeys[$key->getId()] = [
                'id' => $key->getId(),
                'license_software_id' => $license->getId(),
                'software_id' => $key->getSoftware()->getId(),
                'typeKey' => $key->getTypeKey(),
                'value' => $key->getValue(),
                'actived' => $key->getActived()
            ];
        }
        return $this->json([
            'id' => $license->getId(),
            'name' => $license->getName(),
            'license_id' => $license->getLicense()->getId(),
            'software_id' => $license->getSoftware()->getId(),
            'type_id' => $license->getSoftware()->getType()->getId(),
            'keys' => $arKeys
        ]);
    }
}
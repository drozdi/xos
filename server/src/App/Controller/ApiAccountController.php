<?php


namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;

use Main\Entity\User;
use Main\Service\ClaimantManager;

#[Route('/1api/account')]
class ApiAccountController extends AbstractController {
    #[Route('', methods: ['GET'])]
    public function detail (#[CurrentUser] ?User $user): JsonResponse {
        if (null === $user) {
            return $this->json([
                'message' => 'missing credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }
        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'second_name' => $user->getSecondName(),
            'first_name' => $user->getFirstName(),
            'patronymic' => $user->getPatronymic(),
            'description' => $user->getDescription(),
            'date_register' => $user->getDateRegister("Y-m-d H:m:s"),
            'tutor' => $user->getParent()? $user->getParent()->getAlias(): '',
            'last_login' => $user->getLastLogin("Y-m-d H:m:s"),
            'x_timestamp' => $user->getXTimestamp("Y-m-d H:m:s"),
        ]);
    }
    #[Route('/map', name: 'app_account_map', methods: ['GET'])]
    public function map (ClaimantManager $cm): JsonResponse {
        $ret = [];
        foreach ($cm->getMap() as $k => $v) {
            $ret[$k] = $v['map-access']??[];
        }
        return $this->json($ret);
    }
    #[Route('/accesses', name: 'app_account_accesses', methods: ['GET'])]
    public function accesses (#[CurrentUser] ?User $user, ClaimantManager $cm): JsonResponse {
        $ret = [];
        foreach ($user->getAccesses() as $access) {
            $ret[$access->getCode()] = $access->getLevel();
        }
        foreach ($user->getRoles() as $role) {
            foreach ($cm->getAccessesRole($role) as $k => $v) {
                $ret[$k] = ($ret[$k] ?? 0) | $v;
            }
        }
        return $this->json($ret);
    }
    #[Route('/roles', name: 'app_account_roles', methods: ['GET'])]
    public function roles (#[CurrentUser] ?User $user): JsonResponse {
        return $this->json($user->getRoles());
    }
    #[Route('/options', name: 'app_account_options', methods: ['GET'])]
    public function options (#[CurrentUser] ?User $user): JsonResponse {
        return $this->json($user->getOptions());
    }
    #[Route('/options', name: 'app_account_options_update', methods: ['PUT'])]
    public function updateOptions (#[CurrentUser] ?User $user, Request $request, EntityManagerInterface $entityManager): JsonResponse {
        $user->setOptions($request->toArray());
        $entityManager->flush();
        return $this->json($user->getOptions());
    }
    #[Route('', name: 'app_account_update', methods: ['PUT'])]
    public function update (Request $request, EntityManagerInterface $entityManager, ValidatorInterface $validator, UserPasswordHasherInterface $passwordHasher, #[CurrentUser] ?User $user): JsonResponse {
        $ar = $request->toArray();
        $entityManager->getConnection()->beginTransaction();
        $user->setEmail($ar['email'] ?: '');
        $user->setAlias($ar['alias'] ?: '');
        $user->setSecondName($ar['second_name'] ?: '');
        $user->setFirstName($ar['first_name'] ?: '');
        $user->setPatronymic($ar['patronymic'] ?: '');
        $user->setDescription($ar['description'] ?: '');
        $errors = [];
        if ((isset($ar['password']) || isset($ar['confirm_password'])) && $ar['confirm_password'] != $ar['password']) {
            $errors['password'] = "Пароли не совподают";
        }
        $vErrors = $validator->validate($user);
        if (count($errors) > 0 || count($vErrors) > 0) {
            foreach ($vErrors as $error) {
                $errors[$error->getPropertyPath()] = $error->getMessage();
            }
            $entityManager->getConnection()->rollBack();
            return $this->json($errors, Response::HTTP_BAD_REQUEST);
        }
        if (!empty($ar['password']) && $ar['confirm_password'] == $ar['password']) {
            $hashedPassword = $passwordHasher->hashPassword($user, $ar['password']);
            $entityManager->getRepository(User::class)->upgradePassword($user, $hashedPassword);
        }
        $entityManager->flush();
        $entityManager->getConnection()->commit();
        return $this->json($user->getId(), Response::HTTP_CREATED);
        /*return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'second_name' => $user->getSecondName(),
            'first_name' => $user->getFirstName(),
            'patronymic' => $user->getPatronymic(),
            'description' => $user->getDescription(),
            'date_register' => $user->getDateRegister("Y-m-d H:m:s"),
            //'tutor' => $user->getEmail(),
            'last_login' => $user->getLastLogin("Y-m-d H:m:s"),
            'x_timestamp' => $user->getXTimestamp("Y-m-d H:m:s")
        ]);*/
    }
}

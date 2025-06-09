<?php

namespace Main\Service;

use AbstractManager;

use Main\Entity\OU;
use Main\Entity\User;
use Main\Entity\Group;
use Main\Entity\Claimant;

use Main\Repository\OURepository;
use Main\Repository\UserRepository;
use Main\Repository\GroupRepository;
use Main\Repository\ClaimantRepository;

use Symfony\Component\DependencyInjection\ParameterBag\ContainerBagInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Validator\TraceableValidator;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Doctrine\ORM\EntityManagerInterface;

use Symfony\Component\DependencyInjection\ReverseContainer;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ContainerAwareTrait;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Contracts\Service\ServiceSubscriberInterface;

use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationListInterface;


class MainManager extends AbstractManager  {
    public function __construct (ValidatorInterface $Validator) {
        parent::__construct($Validator);
    }
    public function getOURepository (): ?OURepository {
        return $this->getEntityManager()->getRepository(OU::class);
        //return $this->container->getService(OURepository::class);
    }
    public function getUserRepository (): ?UserRepository {
        return $this->getEntityManager()->getRepository(User::class);
        //return $this->container->getService(UserRepository::class);
    }
    public function getGroupRepository (): ?GroupRepository {
        return $this->getEntityManager()->getRepository(Group::class);
        //return $this->container->getService(GroupRepository::class);
    }
    public function getClaimantRepository (): ?ClaimantRepository {
        return $this->getEntityManager()->getRepository(Claimant::class);
        //return $this->container->getService(ClaimantRepository::class);
    }
    protected function getPasswordHasher (): ?UserPasswordHasherInterface {
        return $this->container->get('security.user_password_hasher');
    }

    /**
     * @param mixed $claimant
     * @param array $arClaimant
     *
     * @throws ValidationFailedException
     *
     * @return Claimant
     */
    public function claimant (mixed $claimant = null, ?array $arClaimant = null): Claimant {
        if (is_int($claimant) && $claimant > 0) {
            $claimant = $this->getClaimantRepository()->find($claimant);
        } elseif (is_array($claimant)) {
            $claimant = $this->getClaimantRepository()->findOneBy($claimant);
        }
        if (!($claimant instanceof Claimant)) {
            $claimant = new Claimant();
        }
        if (empty($arClaimant)) {
            return $claimant;
        }
        if (array_key_exists('code', $arClaimant)) {
            $claimant->setCode((string)$arClaimant['code']);
        }
        if (array_key_exists('name', $arClaimant)) {
            $claimant->setName((string)$arClaimant['name']);
        }
        $errors = $this->getValidator()->validate($claimant);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arClaimant, $errors);
        }
        $this->getClaimantRepository()->save($claimant, true);
        return $claimant;
    }
    /**
     * @param null $ou
     * @param array|null $arOu
     *
     * @throws ValidationFailedException
     *
     * @return OU
     */
    public function ou (mixed $ou = null, ?array $arOu = null): OU {
        if (is_int($ou) && $ou > 0) {
            $ou = $this->getOURepository()->find($ou);
        } elseif (is_array($ou)) {
            $ou = $this->getOURepository()->findOneBy($ou);
        }
        if (!($ou instanceof OU)) {
            $ou = new OU();
        }
        if (empty($arOu)) {
            return $ou;
        }
        if (array_key_exists('code', $arOu)) {
            $ou->setCode((string)$arOu['code']);
        }
        if (array_key_exists('name', $arOu)) {
            $ou->setName((string)$arOu['name']);
        }
        if (array_key_exists('description', $arOu)) {
            $ou->setDescription((string)$arOu['description']);
        }
        if (array_key_exists('is_tutors', $arOu)) {
            $ou->setIsTutors((bool)$arOu['is_tutors']);
        } elseif (array_key_exists('isTutors', $arOu)) {
            $ou->setIsTutors((bool)$arOu['isTutors']);
        }
        if (array_key_exists('user', $arOu) && $arOu['user'] instanceof User) {
            $ou->setUser($arOu['user']);
        } elseif (array_key_exists('user_id', $arOu)  && (int)$arOu['user_id'] > 0) {
            $ou->setUser($this->user((int)$arOu['user_id']));
        }
        $errors = $this->getValidator()->validate($ou);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arOu, $errors);
        }
        $this->getOURepository()->save($ou, true);
        return $ou;
    }


    /**
     * @param mixed|null $user
     * @param array|null $arUser
     *
     * @throws ValidationFailedException
     *
     * @return User
     */
    public function user (mixed $user = null, ?array $arUser = null): User {
        if (is_int($user) && $user > 0) {
            $user = $this->getUserRepository()->find($user);
        } elseif (is_array($user)) {
            $user = $this->getUserRepository()->findOneBy($user);
        }
        if (!($user instanceof User)) {
            $user = new User();
        }
        if (empty($arUser)) {
            return $user;
        }
        if (array_key_exists('active', $arUser)) {
            $user->setActive((bool)$arUser['active']);
        }
        if (array_key_exists('loocked', $arUser)) {
            $user->setLoocked((bool)$arUser['loocked']);
        }
        if (array_key_exists('activeFrom', $arUser)) {
            $user->setActiveFrom($arUser['activeFrom']? new \DateTime($arUser['activeFrom']): null);
        }
        if (array_key_exists('activeTo', $arUser)) {
            $user->setActiveTo($arUser['activeTo']? new \DateTime($arUser['activeTo']): null);
        }
        if (array_key_exists('login', $arUser)) {
            $user->setLogin((string)$arUser['login']);
        }
        if (array_key_exists('password', $arUser)) {
            $user->setPassword((string)$arUser['password']);
        }
        if (array_key_exists('email', $arUser)) {
            $user->setEmail((string)$arUser['email']);
        }
        if (array_key_exists('alias', $arUser)) {
            $user->setAlias((string)$arUser['alias']);
        }
        if (array_key_exists('secondName', $arUser)) {
            $user->setSecondName((string)$arUser['secondName']);
        }
        if (array_key_exists('firstName', $arUser)) {
            $user->setFirstName((string)$arUser['firstName']);
        }
        if (array_key_exists('patronymic', $arUser)) {
            $user->setPatronymic((string)$arUser['patronymic']);
        }
        if (array_key_exists('gender', $arUser)) {
            $user->setGender((string)$arUser['gender']);
        }
        if (array_key_exists('description', $arUser)) {
            $user->setDescription((string)$arUser['description']);
        }
        if (array_key_exists('roles', $arUser)) {
            $user->setRoles((array)$arUser['roles']);
        }
        if (array_key_exists('ou', $arUser) && $arUser['ou'] instanceof OU) {
            $user->setOu($arUser['ou']);
        } elseif (array_key_exists('ou_id', $arUser) && (int)$arUser['ou_id'] > 0) {
            $user->setOu($this->ou((int)$arUser['ou_id']));
        }
        if (array_key_exists('parent', $arUser) && $arUser['parent'] instanceof User) {
            $user->setParent($arUser['parent']);
        } elseif (array_key_exists('parent_id', $arUser) && (int)$arUser['parent_id'] > 0) {
            $user->setParent($this->user((int)$arUser['parent_id']));
        }


        if (array_key_exists('accesses', $arUser)) {
            foreach ($user->getAccesses() as $access) {
                $arAccess = !empty($arUser['accesses'][$access->getId()])? $arUser['accesses'][$access->getId()]: null;
                if ($arAccess && (int)$arAccess['level'] > 0) {
                    $access->setLevel($arAccess['level']);
                } else {
                    $user->removeAccess($access);
                    $this->getEntityManager()->remove($access);
                }
                unset($arUser['accesses'][$access->getId()]);
            }
            foreach (($arUser['accesses'] ?: array()) as $arAccess) {
                if ($arAccess && (int)$arAccess['level'] > 0) {
                    $this->getEntityManager()->persist($access = $user->newAccess($this->claimant((int)$arAccess['claimant_id'])));
                    $access->setLevel($arAccess['level']);
                }
            }
        }

        if (array_key_exists('groups', $arUser)) {
            foreach ($user->getGroups() as $gu) {
                $arGu = !empty($arUser['groups'][$gu->getId()])? $arUser['groups'][$gu->getId()]: null;
                if ($arGu) {
                    if (array_key_exists('activeFrom', $arGu)) {
                        $gu->setActiveFrom($arGu['activeFrom'] ? new \DateTime($arGu['activeFrom']) : null);
                    }
                    if (array_key_exists('activeTo', $arGu)) {
                        $gu->setActiveTo($arGu['activeTo'] ? new \DateTime($arGu['activeTo']) : null);
                    }
                } else {
                    $user->removeGroup($gu);
                    $this->getEntityManager()->remove($gu);
                }
                unset($arUser['groups'][$gu->getId()]);
            }
            foreach (($arUser['groups'] ?: array()) as $arGu) {
                $this->getEntityManager()->persist($gu = $user->newGroup($this->group((int)$arGu['group_id'])));
                if (array_key_exists('activeFrom', $arGu)) {
                    $gu->setActiveFrom($arGu['activeFrom'] ? new \DateTime($arGu['activeFrom']) : null);
                }
                if (array_key_exists('activeTo', $arGu)) {
                    $gu->setActiveTo($arGu['activeTo'] ? new \DateTime($arGu['activeTo']) : null);
                }
            }
        }


        $errors = $this->getValidator()->validate($user);
        if ((isset($arUser['password']) || isset($arUser['confirm_password'])) && $arUser['confirm_password'] != $arUser['password']) {
            $errors->add(new ConstraintViolation("Пароли не совподают", "", [$arUser['password'], $arUser['confirm_password']], "", "password"));
        }
        if (count($errors) > 0) {
            throw new ValidationFailedException($arUser, $errors);
        }
        $this->getUserRepository()->save($user, true);
        if (isset($arUser['password']) && $arUser['confirm_password'] == $arUser['password']) {
            $hashedPassword = $this->getPasswordHasher()->hashPassword($user, $arUser['password']);
            $this->getUserRepository()->upgradePassword($user, $hashedPassword);
        }
        return $user;
    }


    /**
     * @param mixed|null $group
     * @param array|null $arGroup
     *
     * @throws ValidationFailedException
     *
     * @return Group
     */
    public function group (mixed $group = null, ?array $arGroup = null): Group {
        if (is_int($group) && $group > 0) {
            $group = $this->getGroupRepository()->find($group);
        } elseif (is_array($group)) {
            $group = $this->getGroupRepository()->findOneBy($group);
        }
        if (!($group instanceof Group)) {
            $group = new Group();
        }
        if (empty($arGroup)) {
            return $group;
        }
        if (array_key_exists('active', $arGroup)) {
            $group->setActive((bool)$arGroup['active']);
        }
        if (array_key_exists('anonymous', $arGroup)) {
            $group->setAnonymous((bool)$arGroup['anonymous']);
        }
        if (array_key_exists('activeFrom', $arGroup)) {
            $group->setActiveFrom($arGroup['activeFrom']? new \DateTime($arGroup['activeFrom']): null);
        }
        if (array_key_exists('activeTo', $arGroup)) {
            $group->setActiveTo($arGroup['activeTo']? new \DateTime($arGroup['activeTo']): null);
        }
        if (array_key_exists('sort', $arGroup)) {
            $group->setSort((int)$arGroup['sort'] ?: 100);
        }
        if (array_key_exists('name', $arGroup)) {
            $group->setName((string)$arGroup['name']);
        }
        if (array_key_exists('code', $arGroup)) {
            $group->setCode((string)$arGroup['code']);
        }
        if (array_key_exists('description', $arGroup)) {
            $group->setDescription((string)$arGroup['description']);
        }
        if (array_key_exists('ou', $arGroup) && $arGroup['ou'] instanceof OU) {
            $group->setOu($arGroup['ou']);
        } elseif (array_key_exists('ou_id', $arGroup) && (int)$arGroup['ou_id'] > 0) {
            $group->setOu($this->ou((int)$arGroup['ou_id']));
        }
        if (array_key_exists('parent', $arGroup) && $arGroup['parent'] instanceof Group) {
            $group->setParent($arGroup['parent']);
        } elseif (array_key_exists('parent_id', $arGroup) && (int)$arGroup['parent_id'] > 0) {
            $group->setParent($this->group((int)$arGroup['parent_id']));
        }
        if (array_key_exists('user', $arGroup) && $arGroup['user'] instanceof User) {
            $group->setUser($arGroup['user']);
        } elseif (array_key_exists('user_id', $arGroup) && (int)$arGroup['user_id'] > 0) {
            $group->setUser($this->user((int)$arGroup['user_id']));
        }
        if ($group->getParent() instanceof Group) {
            $group->setLevel($group->getParent()->getLevel()+1);
        } else {
            $group->setLevel(0);
        }

        if (array_key_exists('accesses', $arGroup)) {
            foreach ($group->getAccesses() as $access) {
                $arAccess = !empty($arGroup['accesses'][$access->getId()])? $arGroup['accesses'][$access->getId()]: null;
                if ($arAccess && (int)$arAccess['level'] > 0) {
                    $access->setLevel($arAccess['level']);
                } else {
                    $group->removeAccess($access);
                    $this->getEntityManager()->remove($access);
                }
                unset($arGroup['accesses'][$access->getId()]);
            }
            foreach (($arGroup['accesses'] ?: array()) as $arAccess) {
                if ($arAccess && (int)$arAccess['level'] > 0) {
                    $this->getEntityManager()->persist($access = $group->newAccess($this->claimant((int)$arAccess['claimant_id'])));
                    $access->setLevel((int)$arAccess['level']);
                }
            }
        }

        if (array_key_exists('users', $arGroup)) {
            foreach ($group->getUsers() as $gu) {
                $arGu = !empty($arGroup['users'][$gu->getId()])? $arGroup['users'][$gu->getId()]: null;
                if ($arGu) {
                    if (array_key_exists('activeFrom', $arGu)) {
                        $gu->setActiveFrom($arGu['activeFrom'] ? new \DateTime($arGu['activeFrom']) : null);
                    }
                    if (array_key_exists('activeTo', $arGu)) {
                        $gu->setActiveTo($arGu['activeTo'] ? new \DateTime($arGu['activeTo']) : null);
                    }
                } else {
                    $group->removeUser($gu);
                    $this->getEntityManager()->remove($gu);
                }
                unset($arGroup['users'][$gu->getId()]);
            }
            foreach (($arGroup['users'] ?: array()) as $arGu) {
                $this->getEntityManager()->persist($gu = $group->newUser($this->user((int)$arGu['user_id'])));
                if (array_key_exists('activeFrom', $arGu)) {
                    $gu->setActiveFrom($arGu['activeFrom'] ? new \DateTime($arGu['activeFrom']) : null);
                }
                if (array_key_exists('activeTo', $arGu)) {
                    $gu->setActiveTo($arGu['activeTo'] ? new \DateTime($arGu['activeTo']) : null);
                }
            }
        }

        $errors = $this->getValidator()->validate($group);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arGroup, $errors);
        }
        $this->getGroupRepository()->save($group, true);
        return $group;
    }
}
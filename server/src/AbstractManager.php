<?php

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ContainerBagInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\TraceableValidator;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\Service\Attribute\Required;
use Symfony\Contracts\Service\ServiceSubscriberInterface;

use Psr\Container\ContainerInterface;

abstract class AbstractManager implements ServiceSubscriberInterface{
    protected ValidatorInterface $validator;
    protected ContainerInterface $container;
    public function __construct (ValidatorInterface $Validator) {
        $this->validator = $Validator;
    }
    #[Required]
    public function setContainer (ContainerInterface $container): ?ContainerInterface
    {
        $previous = $this->container ?? null;
        $this->container = $container;

        return $previous;
    }
    public function getEntityManager (): ?EntityManagerInterface {
        return $this->container->get('doctrine.orm.default_entity_manager');
    }
    public static function getSubscribedServices(): array {
        return [
            'debug.validator' => TraceableValidator::class,
            'doctrine.orm.default_entity_manager' => EntityManagerInterface::class,
            'security.user_password_hasher' => UserPasswordHasherInterface::class,
            'security.authorization_checker' => '?'.AuthorizationCheckerInterface::class,
            'security.token_storage' => '?'.TokenStorageInterface::class,
            'security.csrf.token_manager' => '?'.CsrfTokenManagerInterface::class,
            'request_stack' => '?'.RequestStack::class,
            'http_kernel' => '?'.HttpKernelInterface::class,
            'parameter_bag' => '?'.ContainerBagInterface::class
        ];
    }
    protected function getRequest (): ?Request {
        if (null === ($requestStack = $this->container->get('request_stack'))) {
            return null;
        }
        return $requestStack->getCurrentRequest();
    }
    protected function getUser (): ?UserInterface {
        if (null === $token = $this->container->get('security.token_storage')->getToken()) {
            return null;
        }
        return $token->getUser();
    }
    protected function isGranted (mixed $attribute, mixed $subject = null): bool {
        return $this->container->get('security.authorization_checker')->isGranted($attribute, $subject);
    }
    protected function getValidator (): ?ValidatorInterface {
        return $this->validator;
        //return $this->container->get('debug.validator');
    }
    public function parseViolation (ConstraintViolationListInterface $violationList): array {
        $errors = [];
        if ($violationList->count() > 0) {
            foreach ($violationList as $error) {
                $errors[$error->getPropertyPath()] = "";
                $errors[$error->getPropertyPath()] .= $error->getMessage()."\n";
            }
        }
        return $errors;
    }
}
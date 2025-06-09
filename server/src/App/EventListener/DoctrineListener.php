<?php

namespace App\EventListener;


use Symfony\Component\DependencyInjection\ContainerInterface;
use Doctrine\ORM\Event\LifecycleEventArgs;

class DoctrineListener {
    /**
     * @var ContainerInterface
     */
    private $_container;
    /**
     * DoctrineListener constructor.
     * @param ContainerInterface $container
     */
    public function __construct(ContainerInterface $container)
    {
        $this->_container = $container;
    }
}
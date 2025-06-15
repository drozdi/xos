<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;
        protected function configureRoutes(RoutingConfigurator $routes): void {
        $routes->import('../../config/{routes}/'.$this->environment.'/*.yaml');
        $routes->import('../../config/{routes}/*.yaml');

        if (\is_file(\dirname(dirname(__DIR__)).'/config/routes.yaml')) {
            $routes->import('../../config/routes.yaml');
        } else {
            $routes->import('../../config/{routes}.php');
        }

        $routes->import('../../src/*/config/{routes}/'.$this->environment.'/*.yaml');
        $routes->import('../../src/*/config/{routes}/*.yaml');
        $routes->import('../../src/*/config/routes.yaml');

    }
}

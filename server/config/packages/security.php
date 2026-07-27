<?php

declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\Yaml\Yaml;

// Merges src/*/config/packages/security.yaml (module firewalls cannot be split via YAML imports).
return static function (ContainerConfigurator $container): void {
    $projectDir = dirname(__DIR__, 2);

    $moduleFirewalls = [];
    $moduleAccessControl = [];

    foreach (glob($projectDir.'/src/*/config/packages/security.yaml') ?: [] as $file) {
        /** @var array{security?: array{firewalls?: array<string, mixed>, access_control?: list<array<string, mixed>>}} $parsed */
        $parsed = Yaml::parseFile($file) ?: [];
        $security = $parsed['security'] ?? [];
        foreach ($security['firewalls'] ?? [] as $name => $config) {
            $moduleFirewalls[$name] = $config;
        }
        foreach ($security['access_control'] ?? [] as $rule) {
            $moduleAccessControl[] = $rule;
        }
    }

    $firewalls = $moduleFirewalls + [
        'dev' => [
            'pattern' => '^/(_(profiler|wdt)|css|images|js)/',
            'security' => false,
        ],
        'login' => [
            'pattern' => '^/api/login$',
            'stateless' => true,
            'provider' => 'login_user_provider',
            'user_checker' => 'App\\Security\\UserChecker',
            'json_login' => [
                'check_path' => '/api/login',
                'username_path' => 'username',
                'password_path' => 'password',
                'success_handler' => 'App\\Security\\LoginSuccessHandler',
                'failure_handler' => 'lexik_jwt_authentication.handler.authentication_failure',
            ],
        ],
        'refresh' => [
            'pattern' => '^/api/token/refresh',
            'stateless' => true,
            'provider' => 'login_user_provider',
            'user_checker' => 'App\\Security\\UserChecker',
            'refresh_jwt' => [
                'check_path' => '/api/token/refresh',
            ],
        ],
        'api' => [
            'pattern' => '^/api',
            'stateless' => true,
            'provider' => 'login_user_provider',
            'user_checker' => 'App\\Security\\UserChecker',
            'jwt' => null,
            'logout' => [
                'path' => '/api/logout',
            ],
        ],
        'uploads' => [
            'pattern' => '^/uploads',
            'stateless' => true,
            'provider' => 'login_user_provider',
            'user_checker' => 'App\\Security\\UserChecker',
            'jwt' => null,
        ],
    ];

    $accessControl = array_merge($moduleAccessControl, [
        ['path' => '^/api/login$', 'roles' => 'PUBLIC_ACCESS', 'methods' => ['POST']],
        ['path' => '^/api/token/refresh$', 'roles' => 'PUBLIC_ACCESS', 'methods' => ['POST']],
        ['path' => '^/api/health', 'roles' => 'PUBLIC_ACCESS', 'methods' => ['GET']],
        ['path' => '^/uploads/', 'roles' => 'IS_AUTHENTICATED_FULLY', 'methods' => ['GET']],
        ['path' => '^/api', 'roles' => 'IS_AUTHENTICATED_FULLY'],
    ]);

    $passwordHashers = [
        'Symfony\\Component\\Security\\Core\\User\\PasswordAuthenticatedUserInterface' => 'auto',
    ];

    if ('test' === $container->env()) {
        $passwordHashers = [
            'Symfony\\Component\\Security\\Core\\User\\PasswordAuthenticatedUserInterface' => [
                'algorithm' => 'auto',
                'cost' => 4,
                'time_cost' => 3,
                'memory_cost' => 10,
            ],
        ];
    }

    $container->extension('security', [
        'password_hashers' => $passwordHashers,
        'providers' => [
            'login_user_provider' => [
                'id' => 'App\\Security\\UserProvider\\LoginUserProvider',
            ],
            'email_user_provider' => [
                'id' => 'App\\Security\\UserProvider\\EmailUserProvider',
            ],
        ],
        'firewalls' => $firewalls,
        'access_control' => $accessControl,
        'role_hierarchy' => [
            'ROLE_ADMIN' => ['ROLE_USER'],
        ],
    ]);
};

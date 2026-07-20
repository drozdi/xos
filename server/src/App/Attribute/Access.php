<?php

namespace App\Attribute;

#[\Attribute(\Attribute::TARGET_CLASS | \Attribute::TARGET_METHOD)]
class Access
{
    public function __construct(
        protected string $app,
        /**
         * Проверять доступ к модулю по ролям ROLE_{app} / ROLE_{app}_ROOT / ROLE_ROOT.
         */
        protected bool $checkRoles = true,
        /**
         * Проверять битовые скоупы из setting.json (can_*).
         */
        protected bool $checkScopes = true,
    ) {
    }

    public function getApp(): string
    {
        return $this->app;
    }

    public function checksRoles(): bool
    {
        return $this->checkRoles;
    }

    public function checksScopes(): bool
    {
        return $this->checkScopes;
    }
}

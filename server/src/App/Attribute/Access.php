<?php

namespace App\Attribute;
#[\Attribute(\Attribute::TARGET_CLASS | \Attribute::TARGET_METHOD)]
class Access {
    protected string $app = '';

    public function __construct(string $app)
    {
        $this->app = $app;
    }

    public function getApp(): string
    {
        return $this->app;
    }
}
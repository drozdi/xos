<?php

namespace App\Attribute;
#[\Attribute(\Attribute::TARGET_CLASS | \Attribute::TARGET_METHOD)]
class Access {
    protected $app = '';
    public function __construct (string $app) {
        $this->app = $app;
    }

}
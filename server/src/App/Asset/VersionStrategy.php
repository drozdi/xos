<?php

namespace App\Asset;
use Symfony\Component\Asset\VersionStrategy\VersionStrategyInterface;
class VersionStrategy implements VersionStrategyInterface {
    public function getVersion (string $path): string {
        return (new \DateTime())->format('YmdHms');
    }
    public function applyVersion (string $path): string{
        $version = $this->getVersion($path);
        return $path.'?'.$version;
    }
}
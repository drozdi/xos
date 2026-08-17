<?php

namespace Pkb\Parser;

readonly class ParsedLink
{
    public function __construct(
        public string $type,
        public string $targetKey,
        public ?string $heading = null,
        public ?string $alias = null,
        public int $position = 0,
    ) {
    }
}

<?php

namespace App\Http;

use Symfony\Component\Validator\Constraints as Assert;

final class ListQuery
{
    public function __construct(
        #[Assert\Positive]
        public int $page = 1,
        #[Assert\Range(min: 1, max: 100)]
        public int $limit = 20,
        #[Assert\Length(max: 64)]
        public string $sort = 'id',
        #[Assert\Choice(choices: ['ASC', 'DESC', 'asc', 'desc'])]
        public string $order = 'ASC',
    ) {
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->limit;
    }

    public function direction(): string
    {
        return strtoupper($this->order) === 'DESC' ? 'DESC' : 'ASC';
    }
}

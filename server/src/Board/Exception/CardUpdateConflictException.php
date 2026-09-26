<?php

namespace Board\Exception;

use Board\Entity\Card;

final class CardUpdateConflictException extends \RuntimeException
{
    public function __construct(
        private readonly Card $card,
    ) {
        parent::__construct('Карточка изменена другим пользователем');
    }

    public function getCard(): Card
    {
        return $this->card;
    }
}

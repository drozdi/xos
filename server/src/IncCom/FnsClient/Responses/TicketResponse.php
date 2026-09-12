<?php

namespace IncCom\FnsClient\Responses;

abstract class TicketResponse
{
    protected function __construct(string $processingStatus)
    {
        $this->processingStatus = $processingStatus;
    }

    private $processingStatus;

    public function getProcessingStatus()
    {
        return $this->processingStatus;
    }
}
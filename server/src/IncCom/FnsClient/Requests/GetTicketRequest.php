<?php

namespace IncCom\FnsClient\Requests;

final class GetTicketRequest extends TicketRequest
{
    protected function getRequestElementName()
    {
        return 'GetTicketRequest';
    }

    protected function getInfoElementName()
    {
        return 'GetTicketInfo';
    }
}
<?php

namespace IncCom\FnsClient;

use IncCom\FnsClient\Models\CheckTicketResult;
use IncCom\FnsClient\Models\GetTicketResult;
use IncCom\FnsClient\Models\TemporaryToken;
use IncCom\FnsClient\Models\Ticket;
use IncCom\FnsClient\Requests\AuthRequest;
use IncCom\FnsClient\Requests\CheckTicketRequest;
use IncCom\FnsClient\Requests\GetTicketRequest;
use IncCom\FnsClient\Responses\CheckTicketResponse;
use IncCom\FnsClient\Responses\GetTicketResponse;
use SimpleXMLElement;
use SoapClient;
use stdClass;

final class FNSApi
{
    public final function __construct(string $server, string $user, string $token)
    {
        $this->server = $server;
        $this->user = $user;
        $this->token = $token;
    }

    private $server;
    private $user;
    private $token;
    private $temporaryToken = null;
    private $client = null;

    public function getTemporaryToken()
    {
        if ($this->temporaryToken == null) {
            $client = new SoapClient($this->server . '/open-api/AuthService/0.1?wsdl');
            $message = $this->getRequestMessage(new AuthRequest($this->token));
            $response = $client->__soapCall('GetMessage', [$message]);
            $authResponse = new SimpleXMLElement($response->Message->any);
            $result = $authResponse->children('ns2', true)->Result;
            $this->temporaryToken = TemporaryToken::create(
                $result->Token->__toString(),
                new \DateTimeImmutable($result->ExpireTime->__toString()),
            );
        }
        return $this->temporaryToken;
    }

    public function getCheckTicketMessageId(Ticket $ticket)
    {
        $client = $this->createClient();
        $message = $this->getRequestMessage(new CheckTicketRequest($ticket));
        $response = $client->__soapCall('SendMessage', [$message]);
        return $response->MessageId;
    }

    public function checkTicket(string $messageId)
    {
        $client = $this->createClient();
        $object = new stdClass;
        $object->MessageId = $messageId;
        $response = $client->__soapCall('GetMessage', [$object]);
        if ($response->ProcessingStatus == 'COMPLETED') {
            $checkTicketResponse = new SimpleXMLElement($response->Message->any);
            $result = $checkTicketResponse->Result;
            return CheckTicketResponse::create($response->ProcessingStatus, CheckTicketResult::create(intval($result->Code->__toString()), $result->Message->__toString()));
        }
        return CheckTicketResponse::create($response->ProcessingStatus);
    }

    public function getGetTicketMessageId(Ticket $ticket)
    {
        $client = $this->createClient();
        $message = $this->getRequestMessage(new GetTicketRequest($ticket));
        $response = $client->__soapCall('SendMessage', [$message]);
        return $response->MessageId;
    }

    public function getTicket(string $messageId)
    {
        $client = $this->createClient();
        $object = new stdClass;
        $object->MessageId = $messageId;
        $response = $client->__soapCall('GetMessage', [$object]);
        if ($response->ProcessingStatus == 'COMPLETED') {
            $getTicketResponse = new SimpleXMLElement($response->Message->any);
            $result = $getTicketResponse->Result;
            $code = intval($result->Code->__toString());
            $message = null;
            $ticket = null;
            if ($code == 200) {
                $ticket = json_decode($result->Ticket->__toString());
            } else {
                $message = $result->Message->__toString();
            }
            return GetTicketResponse::create($response->ProcessingStatus, GetTicketResult::create($code, $message, $ticket));
        }
        return GetTicketResponse::create($response->ProcessingStatus);
    }

    private function createClient()
    {
        if ($this->temporaryToken == null || $this->temporaryToken->getExpireTime() < new \DateTimeImmutable()) {
            $this->temporaryToken = null;
            $this->client = null;
            $this->getTemporaryToken();
        }
        if ($this->client == null) {
            $this->client = new SoapClient($this->server . '/open-api/ais3/KktService/0.1?wsdl', [
                'stream_context' => stream_context_create([
                    'http' => [
                        'header' => 'FNS-OpenApi-Token: ' . $this->temporaryToken->getToken() . PHP_EOL . 'FNS-OpenApi-UserToken: ' . base64_encode($this->user)
                    ]
                ])
            ]);
        }
        return $this->client;
    }

    private function getRequestMessage($object)
    {
        $any = new stdClass;
        $any->any = $object;
        $message = new stdClass;
        $message->Message = $any;
        return $message;
    }
}

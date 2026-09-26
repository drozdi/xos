<?php

namespace Main\Controller;

use App\Attribute\Access;
use Main\Repository\AuditLogRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/main/audit', name: 'api_main_audit_')]
#[Access('main.audit')]
class AuditController extends AbstractController
{
    #[Route('/list', name: 'list', methods: ['GET', 'POST'])]
    #[Access('can_read')]
    public function list(Request $request, AuditLogRepository $auditLogRepository): JsonResponse
    {
        $body = [];
        if ('POST' === $request->getMethod() && '' !== (string) $request->getContent()) {
            $decoded = $request->toArray();
            $body = is_array($decoded) ? $decoded : [];
        } else {
            $body = [
                'filters' => array_filter([
                    'action' => $request->query->get('action'),
                    'entity_type' => $request->query->get('entity_type'),
                    'entity_id' => $request->query->get('entity_id'),
                    'actor_id' => $request->query->get('actor_id'),
                    'q' => $request->query->get('q'),
                ], static fn ($v) => null !== $v && '' !== $v),
                'size' => $request->query->get('size', $request->query->get('limit', 50)),
                'offset' => $request->query->get('offset', 1),
                'sortBy' => [['key' => 'createdAt', 'order' => 'DESC']],
            ];
        }

        $req = array_merge([
            't' => 'list',
            'size' => 50,
            'offset' => 1,
            'sortBy' => [['key' => 'createdAt', 'order' => 'DESC']],
            'filters' => [],
        ], $body);

        if (!array_key_exists('limit', $req) && array_key_exists('size', $req)) {
            $req['limit'] = (int) $req['size'];
        }
        $req['limit'] = (int) ($req['limit'] ?? 50);
        $req['offset'] = max(1, (int) ($req['offset'] ?? 1));
        if (!is_array($req['filters'])) {
            $req['filters'] = [];
        }
        if (!is_array($req['sortBy']) || [] === $req['sortBy']) {
            $req['sortBy'] = [['key' => 'createdAt', 'order' => 'DESC']];
        }

        $totalItems = $auditLogRepository->cnt($req['filters']);
        $query = $auditLogRepository->getQueryBuilder(
            $req['filters'],
            $req['sortBy'],
            $req['limit'],
            $req['offset'],
            'a',
        )->getQuery();

        $items = [];
        foreach ($query->execute() as $entry) {
            $items[] = [
                'id' => $entry->getId(),
                'created_at' => $entry->getCreatedAt('Y-m-d H:i:s'),
                'actor_id' => $entry->getActorId(),
                'actor_label' => $entry->getActorLabel(),
                'action' => $entry->getAction(),
                'entity_type' => $entry->getEntityType(),
                'entity_id' => $entry->getEntityId(),
                'summary' => $entry->getSummary(),
            ];
        }

        $start = $req['limit'] > 0 ? $req['limit'] * ($req['offset'] - 1) : 0;
        $end = ($req['limit'] > 0 ? $req['limit'] * $req['offset'] : $totalItems) - 1;
        $end = $end > $totalItems - 1 ? $totalItems - 1 : $end;
        if ($totalItems <= 0) {
            $start = 0;
            $end = -1;
        }

        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf('items %d-%d/%d', $start, $end, $totalItems),
        ]);
    }
}

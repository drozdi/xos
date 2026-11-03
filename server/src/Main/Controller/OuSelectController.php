<?php

namespace Main\Controller;

use App\Http\ListRequest;
use Main\Repository\OURepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Список подразделений для UI Select — достаточно авторизации, scope не проверяется.
 */
#[Route('/api/main/ou', name: 'api_main_ou_')]
class OuSelectController extends AbstractController
{
    #[Route('/select', name: 'select', methods: ['POST'])]
    public function select(Request $request, OURepository $ouRepository): JsonResponse
    {
        $req = ListRequest::merge([
            'limit' => 20,
            'offset' => 1,
            'sortBy' => [[
                'key' => 'sort',
                'order' => 'ASC',
            ], [
                'key' => 'name',
                'order' => 'ASC',
            ]],
            'filters' => [],
        ], $request->toArray());

        $totalItems = $ouRepository->cnt($req['filters']);
        $items = $ouRepository->findSelectItems(
            $req['filters'],
            $req['sortBy'],
            $req['limit'],
            $req['offset'],
        );

        $start = $req['limit'] * ($req['offset'] - 1);
        $end = ($req['limit'] * $req['offset']) - 1;
        $end = $end > $totalItems - 1 ? $totalItems - 1 : $end;

        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf('items %d-%d/%d', $start, $end, $totalItems),
        ]);
    }
}

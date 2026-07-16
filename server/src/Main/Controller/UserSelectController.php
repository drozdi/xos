<?php

namespace Main\Controller;

use Main\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Список пользователей для UI Select — достаточно авторизации, scope не проверяется.
 */
#[Route('/api/main/user', name: 'api_main_user_')]
class UserSelectController extends AbstractController
{
    #[Route('/select', name: 'select', methods: ['POST'])]
    public function select(Request $request, UserRepository $userRepository): JsonResponse
    {
        $req = array_merge([
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => 'login',
                'order' => 'ASC',
            ]],
            'filters' => [
                'ou' => -1,
                'group' => -1,
            ],
        ], $request->toArray());

        if (!array_key_exists('limit', $req) && array_key_exists('size', $req)) {
            $req['limit'] = (int) $req['size'];
        }

        $req['limit'] = (int) $req['limit'];
        $req['offset'] = (int) $req['offset'];

        $totalItems = $userRepository->cnt($req['filters']);
        $items = $userRepository->findSelectItems(
            $req['filters'],
            $req['sortBy'],
            $req['limit'],
            $req['offset'],
        );

        $start = $req['limit'] * ($req['offset'] - 1);
        $end = ($req['limit'] > 0 ? $req['limit'] * $req['offset'] : $totalItems) - 1;
        $end = $end > $totalItems - 1 ? $totalItems - 1 : $end;

        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf('items %d-%d/%d', $start, $end, $totalItems),
        ]);
    }
}

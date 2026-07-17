<?php



namespace IncCom\Controller;



use IncCom\Entity\Tag;

use IncCom\Repository\TagRepository;

use IncCom\Security\Voter\ItemVoter;

use IncCom\Service\IncComManager;

use IncCom\Service\PaginationService;

use Main\Entity\User;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

use Symfony\Component\HttpFoundation\JsonResponse;

use Symfony\Component\HttpFoundation\Request;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Component\Routing\Attribute\Route;

use Symfony\Component\Security\Http\Attribute\CurrentUser;



#[Route('/api/item-categories', name: 'api_item_categories_')]

class ItemCategoriesController extends AbstractController

{

    public function __construct(

        private readonly TagRepository $tagRepository,

        private readonly PaginationService $paginationService,

        private readonly IncComManager $incComManager,

    ) {

    }



    #[Route('', name: 'list', methods: ['GET'])]

    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $page = max(1, (int) $request->query->get('page', 1));

        $size = $this->paginationService->normalizeSize((int) $request->query->get('size', PaginationService::DEFAULT_SIZE));



        $filters = ['user' => $user->getId()];

        if ($request->query->has('search')) {

            $filters['search'] = $request->query->get('search');

        }

        if ($request->query->has('parent')) {

            $filters['parent'] = $request->query->get('parent');

        }



        $paginated = $this->paginationService->paginate(

            $this->tagRepository,

            $page,

            $size,

            $filters,

        );



        $items = array_map(

            fn (Tag $tag) => $this->mapTag($tag),

            $paginated->items,

        );



        return $this->json([

            'items' => $items,

            'total' => $paginated->total,

            'page' => $paginated->page,

            'size' => $paginated->size,

            'pages' => $paginated->pages,

        ]);

    }



    #[Route('', name: 'create', methods: ['POST'])]

    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $data = $request->toArray();

        if (!isset($data['name']) || !is_string($data['name']) || trim($data['name']) === '') {

            return $this->json([

                'error' => 'Validation failed',

                'violations' => ['name' => 'Name is required'],

            ], Response::HTTP_BAD_REQUEST);

        }



        $tag = new Tag();

        $tag->setName(trim($data['name']));

        $tag->setUser($user);

        $tag->setKeywords($this->encodeKeywords($data['keywords'] ?? null));



        if (isset($data['parentId']) && $data['parentId'] !== null) {

            $parent = $this->findUserTagOr404((int) $data['parentId'], $user);

            $tag->setParent($parent);

        }



        $this->tagRepository->save($tag, true);



        return $this->json($this->mapTag($tag), Response::HTTP_CREATED);

    }

    #[Route('/{id}', name: 'read', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function read(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $tag = $this->findTagOr404($id);
        $this->denyAccessUnlessGranted(ItemVoter::MANAGE, $tag);

        return $this->json($this->mapTag($tag));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]

    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $tag = $this->findTagOr404($id);

        $this->denyAccessUnlessGranted(ItemVoter::MANAGE, $tag);



        $data = $request->toArray();



        if (array_key_exists('name', $data)) {

            if (!is_string($data['name']) || trim($data['name']) === '') {

                return $this->json([

                    'error' => 'Validation failed',

                    'violations' => ['name' => 'Name is required'],

                ], Response::HTTP_BAD_REQUEST);

            }

            $tag->setName(trim($data['name']));

        }



        if (array_key_exists('keywords', $data)) {

            $tag->setKeywords($this->encodeKeywords($data['keywords']));

        }



        if (array_key_exists('parentId', $data)) {

            if ($data['parentId'] === null) {

                $tag->setParent(null);

            } else {

                $parent = $this->findUserTagOr404((int) $data['parentId'], $user);

                if ($parent->getId() === $tag->getId()) {

                    return $this->json([

                        'error' => 'Validation failed',

                        'violations' => ['parentId' => 'Category cannot be its own parent'],

                    ], Response::HTTP_BAD_REQUEST);

                }

                if ($this->tagRepository->isDescendantOf($tag, $parent)) {

                    return $this->json([

                        'error' => 'Validation failed',

                        'violations' => ['parentId' => 'Category cannot be moved into its descendant'],

                    ], Response::HTTP_BAD_REQUEST);

                }

                $tag->setParent($parent);

            }

        }



        $this->tagRepository->save($tag, true);



        return $this->json($this->mapTag($tag));

    }



    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]

    public function remove(int $id, #[CurrentUser] ?User $user): Response

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $tag = $this->findTagOr404($id);

        $this->denyAccessUnlessGranted(ItemVoter::MANAGE, $tag);



        try {

            $this->incComManager->deleteTagEntity($tag);

        } catch (\LogicException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);

        }



        return new Response('', Response::HTTP_NO_CONTENT);

    }



    private function findTagOr404(int $id): Tag

    {

        $tag = $this->tagRepository->find($id);

        if ($tag === null) {

            throw $this->createNotFoundException('Item category not found');

        }



        return $tag;

    }



    private function findUserTagOr404(int $id, User $user): Tag

    {

        $tag = $this->tagRepository->find($id);

        if ($tag === null || $tag->getUser()?->getId() !== $user->getId()) {

            throw $this->createNotFoundException('Parent category not found');

        }



        return $tag;

    }



    /**

     * @return array<string, mixed>

     */

    private function mapTag(Tag $tag): array

    {

        return [

            'id' => $tag->getId(),

            'name' => $tag->getName(),

            'parentId' => $tag->getParent()?->getId(),

            'keywords' => $this->decodeKeywords($tag->getKeywords()),

            'childrenCount' => $this->tagRepository->countChildren($tag),

        ];

    }



    /**

     * @param mixed $keywords

     */

    private function encodeKeywords(mixed $keywords): ?string

    {

        if ($keywords === null) {

            return null;

        }



        if (!is_array($keywords)) {

            return null;

        }



        $normalized = array_values(array_filter(

            array_map(static fn ($k) => is_string($k) ? trim($k) : '', $keywords),

            static fn ($k) => $k !== '',

        ));



        if ($normalized === []) {

            return null;

        }



        return json_encode($normalized, JSON_UNESCAPED_UNICODE);

    }



    /**

     * @return string[]

     */

    private function decodeKeywords(?string $keywords): array

    {

        if ($keywords === null || $keywords === '') {

            return [];

        }



        $decoded = json_decode($keywords, true);



        return is_array($decoded) ? array_values($decoded) : [];

    }

}



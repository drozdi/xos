<?php



namespace IncCom\Controller;



use Doctrine\DBAL\Exception\UniqueConstraintViolationException;

use IncCom\Entity\Product;

use IncCom\Entity\Tag;

use IncCom\Repository\ProductRepository;

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



#[Route('/api/items', name: 'api_items_')]

class ItemsController extends AbstractController

{

    public function __construct(

        private readonly ProductRepository $productRepository,

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

        if ($request->query->has('category')) {

            $filters['category'] = (int) $request->query->get('category');

        }

        if ($request->query->has('search')) {

            $filters['search'] = $request->query->get('search');

        }



        $paginated = $this->paginationService->paginate(

            $this->productRepository,

            $page,

            $size,

            $filters,

        );



        $items = array_map(

            fn (Product $product) => $this->mapProduct($product),

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



        $name = trim($data['name']);

        if ($this->productRepository->findOneByUserAndName($user->getId(), $name) !== null) {

            return $this->json(['error' => 'Item with this name already exists'], Response::HTTP_CONFLICT);

        }



        $product = new Product();

        $product->setName($name);

        $product->setUser($user);



        if (array_key_exists('description', $data)) {

            $product->setDescription(is_string($data['description']) ? $data['description'] : null);

        }

        if (array_key_exists('unit', $data)) {

            $product->setUnit(is_string($data['unit']) ? $data['unit'] : null);

        }



        try {

            $this->syncCategories($product, $data['categoryIds'] ?? null, $user);

            $this->productRepository->save($product, true);

        } catch (UniqueConstraintViolationException) {

            return $this->json(['error' => 'Item with this name already exists'], Response::HTTP_CONFLICT);

        }



        return $this->json($this->mapProduct($product), Response::HTTP_CREATED);

    }

    #[Route('/{id}', name: 'read', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function read(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $product = $this->findProductOr404($id);
        $this->denyAccessUnlessGranted(ItemVoter::MANAGE, $product);

        return $this->json($this->mapProduct($product));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]

    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $product = $this->findProductOr404($id);

        $this->denyAccessUnlessGranted(ItemVoter::MANAGE, $product);



        $data = $request->toArray();



        if (array_key_exists('name', $data)) {

            if (!is_string($data['name']) || trim($data['name']) === '') {

                return $this->json([

                    'error' => 'Validation failed',

                    'violations' => ['name' => 'Name is required'],

                ], Response::HTTP_BAD_REQUEST);

            }

            $name = trim($data['name']);

            $duplicate = $this->productRepository->findOneByUserAndName($user->getId(), $name);

            if ($duplicate !== null && $duplicate->getId() !== $product->getId()) {

                return $this->json(['error' => 'Item with this name already exists'], Response::HTTP_CONFLICT);

            }

            $product->setName($name);

        }



        if (array_key_exists('description', $data)) {

            $product->setDescription(is_string($data['description']) ? $data['description'] : null);

        }

        if (array_key_exists('unit', $data)) {

            $product->setUnit(is_string($data['unit']) ? $data['unit'] : null);

        }

        if (array_key_exists('categoryIds', $data)) {

            $this->syncCategories($product, $data['categoryIds'], $user);

        }



        try {

            $this->productRepository->save($product, true);

        } catch (UniqueConstraintViolationException) {

            return $this->json(['error' => 'Item with this name already exists'], Response::HTTP_CONFLICT);

        }



        return $this->json($this->mapProduct($product));

    }



    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]

    public function remove(int $id, #[CurrentUser] ?User $user): Response

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $product = $this->findProductOr404($id);

        $this->denyAccessUnlessGranted(ItemVoter::MANAGE, $product);



        try {

            $this->incComManager->deleteProductEntity($product);

        } catch (\LogicException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);

        }



        return new Response('', Response::HTTP_NO_CONTENT);

    }



    private function findProductOr404(int $id): Product

    {

        $product = $this->productRepository->find($id);

        if ($product === null) {

            throw $this->createNotFoundException('Item not found');

        }



        return $product;

    }



    /**

     * @param mixed $categoryIds

     */

    private function syncCategories(Product $product, mixed $categoryIds, User $user): void

    {

        if ($categoryIds === null) {

            return;

        }



        if (!is_array($categoryIds)) {

            throw new \InvalidArgumentException('categoryIds must be an array');

        }



        foreach ($product->getItemCategories()->toArray() as $existing) {

            $product->removeItemCategory($existing);

        }



        foreach ($categoryIds as $categoryId) {

            $tag = $this->tagRepository->find((int) $categoryId);

            if ($tag === null || $tag->getUser()?->getId() !== $user->getId()) {

                throw $this->createNotFoundException('Item category not found');

            }

            $product->addItemCategory($tag);

        }

    }



    /**

     * @return array<string, mixed>

     */

    private function mapProduct(Product $product): array

    {

        $categoryIds = [];

        foreach ($product->getItemCategories() as $tag) {

            if ($tag instanceof Tag && $tag->getId() !== null) {

                $categoryIds[] = $tag->getId();

            }

        }



        return [

            'id' => $product->getId(),

            'name' => $product->getName(),

            'description' => $product->getDescription(),

            'unit' => $product->getUnit(),

            'categoryIds' => $categoryIds,

        ];

    }

}



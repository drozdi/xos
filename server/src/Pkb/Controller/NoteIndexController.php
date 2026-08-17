<?php



namespace Pkb\Controller;



use App\Attribute\Access;

use Main\Entity\User;

use Pkb\Repository\NoteIndexRepository;

use Pkb\Repository\PkbLinkRepository;

use Pkb\Service\GraphService;

use Pkb\Service\IndexRebuildService;

use Pkb\Service\LinkIndexService;

use Pkb\Service\PkbManager;

use Pkb\Service\PkbPermissionResolver;

use Pkb\Service\SearchReplaceService;
use Pkb\Service\SearchService;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

use Symfony\Component\HttpFoundation\JsonResponse;

use Symfony\Component\HttpFoundation\Request;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

use Symfony\Component\Routing\Attribute\Route;

use Symfony\Component\Security\Http\Attribute\CurrentUser;



#[Route('/api/pkb')]

#[Access('pkb')]

class NoteIndexController extends AbstractController

{

    #[Route('/vaults/{id}/backlinks', requirements: ['id' => '\d+'], methods: ['GET'])]

    public function backlinks(

        int $id,

        Request $request,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        NoteIndexRepository $noteIndexRepository,

        PkbLinkRepository $pkbLinkRepository,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $path = (string) $request->query->get('path', '');

        if ('' === $path) {

            return $this->json(['error' => 'path is required'], Response::HTTP_BAD_REQUEST);

        }



        $vault = $pkbManager->getVault($id, $user);

        $note = $noteIndexRepository->findOneByVaultAndPath($vault, $path);

        $title = $note?->getTitle() ?? pathinfo($path, PATHINFO_FILENAME);



        $links = $pkbLinkRepository->findBacklinks($vault, $path, $title);

        $sourceTitles = [];

        foreach ($links as $link) {

            $sourceTitles[$link->getSourcePath()] = true;

        }



        $titleByPath = [];

        foreach (array_keys($sourceTitles) as $sourcePath) {

            $sourceNote = $noteIndexRepository->findOneByVaultAndPath($vault, $sourcePath);

            $titleByPath[$sourcePath] = $sourceNote?->getTitle() ?? pathinfo((string) $sourcePath, PATHINFO_FILENAME);

        }



        $backlinks = [];

        foreach ($links as $link) {

            $backlinks[] = [

                'sourcePath' => $link->getSourcePath(),

                'sourceTitle' => $titleByPath[$link->getSourcePath()] ?? pathinfo($link->getSourcePath(), PATHINFO_FILENAME),

                'linkType' => $link->getLinkType(),

                'alias' => $link->getAlias(),

            ];

        }



        return $this->json(['backlinks' => $backlinks]);

    }



    #[Route('/vaults/{id}/notes/by-title', requirements: ['id' => '\d+'], methods: ['GET'])]

    public function byTitle(

        int $id,

        Request $request,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        LinkIndexService $linkIndexService,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $title = (string) $request->query->get('title', '');

        if ('' === $title) {

            return $this->json(['error' => 'title is required'], Response::HTTP_BAD_REQUEST);

        }



        $vault = $pkbManager->getVault($id, $user);



        return $this->json($linkIndexService->resolveByTitle($vault, $title));

    }



    #[Route('/vaults/{id}/notes', requirements: ['id' => '\d+'], methods: ['GET'])]

    public function listNotes(

        int $id,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        NoteIndexRepository $noteIndexRepository,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $vault = $pkbManager->getVault($id, $user);

        $notes = $noteIndexRepository->findByVault($vault);



        return $this->json([

            'notes' => array_map(

                static fn ($note): array => [

                    'path' => $note->getPath(),

                    'title' => $note->getTitle(),

                    'tags' => $note->getTags(),

                    'inbound_count' => $note->getInboundCount(),

                    'outbound_count' => $note->getOutboundCount(),

                ],

                $notes,

            ),

        ]);

    }



    #[Route('/vaults/{id}/graph', requirements: ['id' => '\d+'], methods: ['GET'])]

    public function graph(

        int $id,

        Request $request,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        GraphService $graphService,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $vault = $pkbManager->getVault($id, $user);

        $filter = $request->query->get('filter');

        $limit = (int) $request->query->get('limit', 1000);



        return $this->json($graphService->buildGraph(

            $vault,

            is_string($filter) ? $filter : null,

            $limit,

        ));

    }



    #[Route('/vaults/{id}/search', requirements: ['id' => '\d+'], methods: ['GET'])]

    public function search(

        int $id,

        Request $request,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        SearchService $searchService,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $query = (string) $request->query->get('q', '');

        $vault = $pkbManager->getVault($id, $user);



        return $this->json($searchService->search($vault, $query));

    }



    #[Route('/vaults/{id}/search/replace', requirements: ['id' => '\d+'], methods: ['POST'])]

    public function searchReplace(

        int $id,

        Request $request,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        SearchReplaceService $searchReplaceService,

        PkbPermissionResolver $permissionResolver,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $vault = $pkbManager->getVault($id, $user);

        if (!$permissionResolver->canWriteFiles($vault, $user)) {

            throw new AccessDeniedHttpException('Нет прав на запись файлов vault');

        }



        $data = $request->toArray();

        $find = (string) ($data['find'] ?? '');

        $replace = (string) ($data['replace'] ?? '');

        $dryRun = filter_var($data['dryRun'] ?? false, FILTER_VALIDATE_BOOL);



        return $this->json($searchReplaceService->searchReplace($vault, $user, $find, $replace, $dryRun));

    }



    #[Route('/vaults/{id}/index/status', requirements: ['id' => '\d+'], methods: ['GET'])]

    public function indexStatus(

        int $id,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        IndexRebuildService $indexRebuildService,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $vault = $pkbManager->getVault($id, $user);



        return $this->json($indexRebuildService->getIndexStatus($vault));

    }



    #[Route('/vaults/{id}/index/rebuild', requirements: ['id' => '\d+'], methods: ['POST'])]

    public function indexRebuild(

        int $id,

        #[CurrentUser] ?User $user,

        PkbManager $pkbManager,

        IndexRebuildService $indexRebuildService,

        PkbPermissionResolver $permissionResolver,

    ): JsonResponse {

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        \assert($user instanceof User);



        $vault = $pkbManager->getVault($id, $user);

        if (!$permissionResolver->canRebuildIndex($vault, $user)) {

            throw new AccessDeniedHttpException('Нет прав на перестроение индекса');

        }



        return $this->json($indexRebuildService->rebuildVaultIndex($vault, $user));

    }

}


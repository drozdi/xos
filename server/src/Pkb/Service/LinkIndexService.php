<?php



namespace Pkb\Service;



use Doctrine\ORM\EntityManagerInterface;

use Pkb\Entity\NoteIndex;

use Pkb\Entity\PkbLink;

use Pkb\Entity\Vault;

use Pkb\Parser\ParsedLink;

use Pkb\Parser\WikilinkParser;

use Pkb\Repository\NoteIndexRepository;

use Pkb\Repository\PkbLinkRepository;



final class LinkIndexService

{

    private const DEFAULT_NOTE_FOLDER = 'Notes';

    private const NOTE_EXTENSION = '.md';



    public function __construct(

        private readonly EntityManagerInterface $entityManager,

        private readonly WikilinkParser $wikilinkParser,

        private readonly NoteIndexRepository $noteIndexRepository,

        private readonly PkbLinkRepository $pkbLinkRepository,

    ) {

    }



    /**

     * @return array{

     *     path: string,

     *     title: string,

     *     tags: list<string>,

     *     outboundLinks: list<array{

     *         type: string,

     *         targetKey: string,

     *         targetPath: ?string,

     *         heading: ?string,

     *         alias: ?string,

     *         position: int

     *     }>

     * }

     */

    public function parseAndUpsert(Vault $vault, string $path, string $content, ?\DateTimeInterface $mtime = null): array

    {

        $parsedLinks = $this->wikilinkParser->parse($content);

        $title = $this->extractTitle($content, $path);

        $tags = $this->extractTags($parsedLinks);

        $contentHash = hash('sha256', $content);

        $bodyExcerpt = $this->extractBodyExcerpt($content);

        $indexedAt = new \DateTime();

        $mtime ??= $indexedAt;



        $noteIndex = $this->noteIndexRepository->findOneByVaultAndPath($vault, $path);

        if (!$noteIndex instanceof NoteIndex) {

            $noteIndex = new NoteIndex();

            $noteIndex->setVault($vault);

            $noteIndex->setPath($path);

            $this->entityManager->persist($noteIndex);

        }



        $noteIndex

            ->setTitle($title)

            ->setTags($tags)

            ->setContentHash($contentHash)

            ->setBodyExcerpt($bodyExcerpt)

            ->setMtime($mtime)

            ->setIndexedAt($indexedAt);



        $oldLinks = $this->pkbLinkRepository->findBy(['vault' => $vault, 'sourcePath' => $path]);

        $affectedTargetPaths = [];

        foreach ($oldLinks as $oldLink) {

            if (null !== $oldLink->getTargetPath()) {

                $affectedTargetPaths[$oldLink->getTargetPath()] = true;

            }

        }



        $this->pkbLinkRepository->deleteByVaultAndSourcePath($vault, $path);



        $outboundLinks = [];

        foreach ($parsedLinks as $parsedLink) {

            $targetPath = $this->resolveTargetPath($vault, $parsedLink);

            if (null !== $targetPath) {

                $affectedTargetPaths[$targetPath] = true;

            }



            $link = new PkbLink();

            $link->setVault($vault);

            $link->setSourcePath($path);

            $link->setTargetKey($parsedLink->targetKey);

            $link->setTargetPath($targetPath);

            $link->setLinkType($parsedLink->type);

            $link->setAlias($parsedLink->alias);

            $link->setPosition($parsedLink->position);

            $this->entityManager->persist($link);



            $outboundLinks[] = [

                'type' => $parsedLink->type,

                'targetKey' => $parsedLink->targetKey,

                'targetPath' => $targetPath,

                'heading' => $parsedLink->heading,

                'alias' => $parsedLink->alias,

                'position' => $parsedLink->position,

            ];

        }



        $outboundCount = count($parsedLinks);

        $noteIndex->setOutboundCount($outboundCount);



        $this->entityManager->flush();

        $this->reResolveLinksForTargetKey($vault, $title, $path);

        foreach (array_keys($affectedTargetPaths) as $targetPath) {
            $this->refreshInboundCount($vault, $targetPath);
        }

        $this->refreshInboundCount($vault, $path);

        $this->entityManager->flush();



        return [

            'path' => $path,

            'title' => $title,

            'tags' => $tags,

            'outboundLinks' => $outboundLinks,

        ];

    }



    public function removeNoteFromIndex(Vault $vault, string $path): void

    {

        $this->pkbLinkRepository->deleteByVaultAndSourcePath($vault, $path);

        $this->pkbLinkRepository->deleteByVaultAndPath($vault, $path);

        $this->noteIndexRepository->deleteByVaultAndPath($vault, $path);

        $this->entityManager->flush();

    }



    /**

     * @return array{path: ?string, title: string, ambiguous: bool, candidates?: list<array{path: string, title: string}>}

     */

    public function resolveByTitle(Vault $vault, string $title): array

    {

        $normalizedTitle = $this->wikilinkParser->normalizeTargetKey($title);

        $candidates = $this->findResolutionCandidates($vault, $normalizedTitle);



        if ([] === $candidates) {

            return [

                'path' => null,

                'title' => $normalizedTitle,

                'ambiguous' => false,

            ];

        }



        if (count($candidates) > 1) {

            return [

                'path' => null,

                'title' => $normalizedTitle,

                'ambiguous' => true,

                'candidates' => array_map(

                    static fn (NoteIndex $note): array => [

                        'path' => $note->getPath(),

                        'title' => $note->getTitle(),

                    ],

                    $candidates,

                ),

            ];

        }



        $note = $candidates[0];



        return [

            'path' => $note->getPath(),

            'title' => $note->getTitle(),

            'ambiguous' => false,

        ];

    }



    /**

     * @return list<NoteIndex>

     */

    private function findResolutionCandidates(Vault $vault, string $targetKey): array

    {

        $caseSensitive = false;

        $extension = self::NOTE_EXTENSION;



        $exactPath = $this->noteIndexRepository->findOneByVaultAndPath($vault, $targetKey);

        if ($exactPath instanceof NoteIndex) {

            return [$exactPath];

        }



        $defaultPath = self::DEFAULT_NOTE_FOLDER.'/'.$targetKey.$extension;

        $defaultNote = $this->noteIndexRepository->findOneByVaultAndPath($vault, $defaultPath);

        if ($defaultNote instanceof NoteIndex) {

            return [$defaultNote];

        }



        $byTitle = $this->noteIndexRepository->findByVaultPathEndingWith(

            $vault,

            $targetKey.$extension,

            $caseSensitive,

        );

        if ([] !== $byTitle) {

            return $byTitle;

        }



        return $this->noteIndexRepository->findByVaultAndTitle($vault, $targetKey, $caseSensitive);

    }



    private function resolveTargetPath(Vault $vault, ParsedLink $parsedLink): ?string

    {

        if ('tag' === $parsedLink->type) {

            return null;

        }



        $candidates = $this->findResolutionCandidates($vault, $parsedLink->targetKey);

        if (1 !== count($candidates)) {

            return null;

        }



        return $candidates[0]->getPath();

    }



    private function reResolveLinksForTargetKey(Vault $vault, string $targetKey, string $targetPath): void
    {
        $links = $this->pkbLinkRepository->createQueryBuilder('l')
            ->andWhere('l.vault = :vault')
            ->andWhere('LOWER(l.targetKey) = LOWER(:key)')
            ->andWhere('l.linkType != :tagType')
            ->setParameter('vault', $vault)
            ->setParameter('key', $targetKey)
            ->setParameter('tagType', PkbLink::TYPE_TAG)
            ->getQuery()
            ->getResult();

        foreach ($links as $link) {
            $oldPath = $link->getTargetPath();
            $link->setTargetPath($targetPath);
            if (null !== $oldPath && $oldPath !== $targetPath) {
                $this->refreshInboundCount($vault, $oldPath);
            }
        }
    }

    private function refreshInboundCount(Vault $vault, string $targetPath): void

    {

        $targetNote = $this->noteIndexRepository->findOneByVaultAndPath($vault, $targetPath);

        if (!$targetNote instanceof NoteIndex) {

            return;

        }



        $count = $this->pkbLinkRepository->countInboundForTargetPath($vault, $targetPath);

        $targetNote->setInboundCount($count);

    }



    private function extractTitle(string $content, string $path): string

    {

        if (preg_match('/^#\s+(.+)$/m', $content, $matches)) {

            return trim($matches[1]);

        }



        $filename = pathinfo($path, PATHINFO_FILENAME);



        return '' !== $filename ? $filename : basename($path);

    }



    /**

     * @param list<ParsedLink> $parsedLinks

     *

     * @return list<string>

     */

    private function extractTags(array $parsedLinks): array

    {

        $tags = [];

        foreach ($parsedLinks as $link) {

            if ('tag' === $link->type) {

                $tags[] = $link->targetKey;

            }

        }



        return array_values(array_unique($tags));

    }



    private function extractBodyExcerpt(string $content): string

    {

        $text = preg_replace('/```[\s\S]*?```/', '', $content) ?? $content;

        $text = preg_replace('/!\[\[[^\]]+\]\]/', '', $text) ?? $text;

        $text = preg_replace('/\[\[[^\]]+\]\]/', '', $text) ?? $text;

        $text = preg_replace('/[#*_>`~-]/', '', $text) ?? $text;

        $text = preg_replace('/\s+/', ' ', trim($text)) ?? $text;



        return mb_substr($text, 0, 500);

    }

}


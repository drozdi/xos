<?php

namespace App\Tests\Main;

use App\Tests\AuthWebTestCase;
use Board\Entity\Attachment;
use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\Card;
use Board\Entity\Workspace;
use Board\Entity\WorkspaceMember;
use Board\Enum\MemberRole;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\File as MainFile;
use Main\Entity\User;
use Main\Service\FileAccess;
use Main\Service\SharedFileRead;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class SharedFileReadTest extends AuthWebTestCase
{
    public function testBoardMemberCanReadAttachmentUploadedBySomeoneElse(): void
    {
        $client = static::createClient();
        $em = $this->schema($client);
        $owner = $this->createTestUser($client, 'file_owner', 'password', ['ROLE_USER']);
        $member = $this->createTestUser($client, 'file_member', 'password', ['ROLE_USER']);
        $stranger = $this->createTestUser($client, 'file_stranger', 'password', ['ROLE_USER']);

        $file = new MainFile();
        $file->setModule('board');
        $file->setCreatedBy($owner);
        $file->setFileName('pic.png');
        $file->setOriginalName('pic.png');
        $file->setContentType('image/png');
        $file->setSubDir('board');
        $file->setFileSize(12);

        $workspace = new Workspace();
        $workspace->setOwner($owner);
        $workspace->setName('Files');
        $memberLink = new WorkspaceMember();
        $memberLink->setUser($member);
        $memberLink->setRole(MemberRole::Editor);
        $workspace->addMember($memberLink);

        $board = new Board();
        $board->setWorkspace($workspace);
        $board->setTitle('Board');
        $board->setCreatedBy($owner);
        $list = new BoardList();
        $list->setBoard($board);
        $list->setTitle('Todo');
        $card = new Card();
        $card->setList($list);
        $card->setTitle('Card');

        $em->persist($file);
        $em->persist($workspace);
        $em->persist($board);
        $em->persist($list);
        $em->persist($card);
        $em->flush();

        $attachment = new Attachment();
        $attachment->setCard($card);
        $attachment->setFileId((int) $file->getId());
        $attachment->setFileName('pic.png');
        $attachment->setFileUrl('/uploads/board/board/pic.png');
        $attachment->setUploadedBy($owner);
        $em->persist($attachment);
        $em->flush();

        $shared = $client->getContainer()->get(SharedFileRead::class);
        self::assertInstanceOf(SharedFileRead::class, $shared);
        $access = new FileAccess();

        self::assertTrue($access->canRead($file, $owner));
        self::assertFalse($access->canRead($file, $member));
        self::assertTrue($shared->canRead($file, $member));
        self::assertFalse($shared->canRead($file, $stranger));
    }

    private function schema(KernelBrowser $client): EntityManagerInterface
    {
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $em->getClassMetadata(User::class),
            $em->getClassMetadata(MainFile::class),
            $em->getClassMetadata(Workspace::class),
            $em->getClassMetadata(WorkspaceMember::class),
            $em->getClassMetadata(Board::class),
            $em->getClassMetadata(BoardList::class),
            $em->getClassMetadata(Card::class),
            $em->getClassMetadata(Attachment::class),
        ];
        $tool = new SchemaTool($em);
        $tool->dropSchema($metadata);
        $tool->createSchema($metadata);

        return $em;
    }
}

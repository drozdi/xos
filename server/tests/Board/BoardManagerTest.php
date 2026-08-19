<?php

namespace App\Tests\Board;

use App\Tests\AuthWebTestCase;
use Board\Entity\ActivityLog;
use Board\Entity\Attachment;
use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\BoardMember;
use Board\Entity\Card;
use Board\Entity\Checklist;
use Board\Entity\ChecklistItem;
use Board\Entity\Comment;
use Board\Entity\Label;
use Board\Entity\Workspace;
use Board\Entity\WorkspaceMember;
use Board\Enum\ActivityAction;
use Board\Enum\MemberRole;
use Board\Service\BoardManager;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Main\Service\FileManager;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class BoardManagerTest extends AuthWebTestCase
{
    public function testListAndCardCrudWithGapPositions(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $listA = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'To Do']);
        $listB = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Done']);

        self::assertSame(1024, $listA->getOrderIndex());
        self::assertSame(2048, $listB->getOrderIndex());

        $cardA = $manager->createCard($listA, $fixture['owner'], ['title' => 'Task A']);
        $cardB = $manager->createCard($listA, $fixture['owner'], ['title' => 'Task B']);

        self::assertSame(1024, $cardA->getPosition());
        self::assertSame(2048, $cardB->getPosition());

        $manager->updateList($listA, $fixture['owner'], ['title' => 'Backlog', 'assignee_id' => $fixture['editor']->getId()]);
        self::assertSame('Backlog', $listA->getTitle());
        self::assertSame($fixture['editor']->getId(), $listA->getAssignee()?->getId());

        $detail = $manager->serializeBoardDetail($fixture['board'], $fixture['owner']);
        self::assertCount(2, $detail['lists']);
        self::assertSame('Backlog', $detail['lists'][0]['title']);
        self::assertSame($fixture['editor']->getId(), $detail['lists'][0]['assignee']['id']);
        self::assertCount(2, $detail['lists'][0]['cards']);

        $listBId = $listB->getId();
        $manager->deleteList($listB, $fixture['owner']);
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->clear();
        self::assertNull($em->getRepository(BoardList::class)->find($listBId));
    }

    public function testMoveCardBetweenLists(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $listA = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'A']);
        $listB = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'B']);
        $card = $manager->createCard($listA, $fixture['owner'], ['title' => 'Move me']);

        $manager->moveCard($card, $fixture['owner'], $listB->getId(), 1024);

        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->refresh($card);
        self::assertSame($listB->getId(), $card->getList()?->getId());
        self::assertSame(1024, $card->getPosition());
    }

    public function testListAssigneeObserverCanCreateCard(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Mine']);
        $manager->updateList($list, $fixture['owner'], ['assignee_id' => $fixture['observer']->getId()]);

        $card = $manager->createCard($list, $fixture['observer'], ['title' => 'Observer task']);
        self::assertSame('Observer task', $card->getTitle());
    }

    public function testLabelCrud(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $label = $manager->createLabel($fixture['board'], $fixture['owner'], ['name' => 'Bug', 'color' => '#eb5a46']);
        self::assertSame('Bug', $label->getName());

        $manager->updateLabel($label, $fixture['owner'], ['name' => 'Critical', 'color' => '#ff0000']);
        self::assertSame('Critical', $label->getName());

        $detail = $manager->serializeBoardDetail($fixture['board'], $fixture['owner']);
        self::assertCount(1, $detail['labels']);
        self::assertSame('Critical', $detail['labels'][0]['name']);

        $manager->deleteLabel($label, $fixture['owner']);
        $detail = $manager->serializeBoardDetail($fixture['board'], $fixture['owner']);
        self::assertSame([], $detail['labels']);
    }

    public function testChecklistCrud(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Tasks']);
        $card = $manager->createCard($list, $fixture['owner'], ['title' => 'Card']);

        $checklist = $manager->createChecklist($card, $fixture['owner'], ['title' => 'Todo']);
        self::assertSame('Todo', $checklist->getTitle());
        self::assertSame(1024, $checklist->getPosition());

        $itemA = $manager->addChecklistItem($checklist, $fixture['owner'], ['text' => 'Step 1']);
        $itemB = $manager->addChecklistItem($checklist, $fixture['owner'], ['text' => 'Step 2']);
        self::assertSame(1024, $itemA->getPosition());
        self::assertSame(2048, $itemB->getPosition());

        $manager->updateChecklistItem($itemA, $fixture['owner'], ['checked' => true, 'text' => 'Done step']);
        self::assertTrue($itemA->isChecked());
        self::assertSame('Done step', $itemA->getText());

        $manager->updateChecklist($checklist, $fixture['owner'], ['title' => 'Checklist', 'position' => 2048]);
        self::assertSame('Checklist', $checklist->getTitle());

        $detail = $manager->serializeCardDetail($card);
        self::assertCount(1, $detail['checklists']);
        self::assertSame('Checklist', $detail['checklists'][0]['title']);
        self::assertCount(2, $detail['checklists'][0]['items']);

        $manager->deleteChecklistItem($itemB, $fixture['owner']);
        $manager->deleteChecklist($checklist, $fixture['owner']);
        $detail = $manager->serializeCardDetail($card);
        self::assertSame([], $detail['checklists']);
    }

    public function testCommentCrudAndAuth(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'A']);
        $card = $manager->createCard($list, $fixture['editor'], ['title' => 'Discuss']);

        try {
            $manager->createComment($card, $fixture['observer'], ['text' => 'Nope']);
            self::fail('Observer must not post comments');
        } catch (AccessDeniedHttpException) {
        }

        $comment = $manager->createComment($card, $fixture['editor'], ['text' => 'Hello']);
        self::assertSame('Hello', $comment->getText());

        $manager->updateComment($comment, $fixture['editor'], ['text' => 'Updated']);
        self::assertSame('Updated', $comment->getText());

        $comments = $manager->listComments($card, $fixture['owner']);
        self::assertCount(1, $comments);
        self::assertSame('Updated', $comments[0]['text']);

        $other = $manager->createComment($card, $fixture['owner'], ['text' => 'Owner says']);

        try {
            $manager->updateComment($other, $fixture['editor'], ['text' => 'Hack']);
            self::fail('Editor must not edit owner comment');
        } catch (AccessDeniedHttpException) {
        }

        $manager->deleteComment($other, $fixture['owner']);
        $comments = $manager->listComments($card, $fixture['owner']);
        self::assertCount(1, $comments);
    }

    public function testAttachmentUploadAndDelete(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);
        /** @var FileManager $fileManager */
        $fileManager = $client->getContainer()->get(FileManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Files']);
        $card = $manager->createCard($list, $fixture['owner'], ['title' => 'With file']);

        $tmp = tempnam(sys_get_temp_dir(), 'board');
        self::assertNotFalse($tmp);
        file_put_contents($tmp, 'attachment body');

        $mainFile = $fileManager->importFromLocalPath($tmp, 'board', 'test', 'note.txt');
        $attachment = $manager->createAttachmentFromUpload($card, $fixture['owner'], $mainFile);

        self::assertSame('note.txt', $attachment->getFileName());
        self::assertSame('test/note.txt', $attachment->getFileUrl());

        $listed = $manager->listAttachments($card, $fixture['owner']);
        self::assertCount(1, $listed);
        self::assertSame('note.txt', $listed[0]['file_name']);

        $detail = $manager->serializeCardDetail($card);
        self::assertCount(1, $detail['attachments']);

        $manager->deleteAttachment($attachment, $fixture['owner']);
        self::assertSame([], $manager->listAttachments($card, $fixture['owner']));

        @unlink($tmp);
    }

    public function testImportAttachmentFromLocalPathUsesBoardSubDir(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Import']);
        $card = $manager->createCard($list, $fixture['owner'], ['title' => 'Imported file']);

        $tmp = tempnam(sys_get_temp_dir(), 'board');
        self::assertNotFalse($tmp);
        file_put_contents($tmp, 'imported body');

        $boardId = (int) $fixture['board']->getId();
        $attachment = $manager->importAttachmentFromLocalPath($card, $fixture['owner'], $tmp, 'import.txt');

        self::assertSame('import.txt', $attachment->getFileName());
        self::assertSame(sprintf('boards/%d/import.txt', $boardId), $attachment->getFileUrl());

        $manager->deleteAttachment($attachment, $fixture['owner']);
        @unlink($tmp);
    }

    public function testResolveAttachmentAbsolutePath(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Path']);
        $card = $manager->createCard($list, $fixture['owner'], ['title' => 'Path card']);

        $tmp = tempnam(sys_get_temp_dir(), 'board');
        self::assertNotFalse($tmp);
        file_put_contents($tmp, 'path test');

        $attachment = $manager->importAttachmentFromLocalPath($card, $fixture['owner'], $tmp, 'path.txt');
        $resolvedPath = $manager->resolveAttachmentAbsolutePath($attachment);

        self::assertSame('path test', file_get_contents($resolvedPath));

        $manager->deleteAttachment($attachment, $fixture['owner']);
        @unlink($tmp);
    }

    public function testCardAssigneesAndLabelsSync(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $list = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'Sync']);
        $card = $manager->createCard($list, $fixture['owner'], ['title' => 'Tagged']);

        $labelA = $manager->createLabel($fixture['board'], $fixture['owner'], ['name' => 'A', 'color' => '#111']);
        $labelB = $manager->createLabel($fixture['board'], $fixture['owner'], ['name' => 'B', 'color' => '#222']);

        $manager->setCardLabels($card, $fixture['owner'], [$labelA->getId(), $labelB->getId()]);
        $manager->setCardAssignees($card, $fixture['owner'], [$fixture['editor']->getId()]);

        $summary = $manager->serializeCardSummary($card);
        self::assertSame([$labelA->getId(), $labelB->getId()], $summary['label_ids']);
        self::assertSame([$fixture['editor']->getId()], $summary['assignee_ids']);

        $manager->setCardLabels($card, $fixture['owner'], [$labelB->getId()]);
        $manager->setCardAssignees($card, $fixture['owner'], []);

        $summary = $manager->serializeCardSummary($card);
        self::assertSame([$labelB->getId()], $summary['label_ids']);
        self::assertSame([], $summary['assignee_ids']);
    }

    public function testActivityLoggingOnMoveAndCheck(): void
    {
        $client = static::createClient();
        $fixture = $this->prepareFixture($client);
        /** @var BoardManager $manager */
        $manager = $client->getContainer()->get(BoardManager::class);

        $listA = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'A']);
        $listB = $manager->createList($fixture['board'], $fixture['owner'], ['title' => 'B']);
        $card = $manager->createCard($listA, $fixture['owner'], ['title' => 'Act']);

        $manager->updateCard($card, $fixture['owner'], ['title' => 'Updated title']);
        $manager->moveCard($card, $fixture['owner'], $listB->getId(), 1024);

        $checklist = $manager->createChecklist($card, $fixture['owner'], ['title' => 'CL']);
        $item = $manager->addChecklistItem($checklist, $fixture['owner'], ['text' => 'x']);
        $manager->updateChecklistItem($item, $fixture['owner'], ['checked' => true]);
        $manager->createComment($card, $fixture['editor'], ['text' => 'note']);

        $activity = $manager->listBoardActivity($fixture['board'], $fixture['owner'], 20, 0);
        $actions = array_column($activity, 'action');

        self::assertContains(ActivityAction::CardUpdated->value, $actions);
        self::assertContains(ActivityAction::CardMoved->value, $actions);
        self::assertContains(ActivityAction::ChecklistItemChecked->value, $actions);
        self::assertContains(ActivityAction::CommentAdded->value, $actions);
    }

    /**
     * @return array{owner: User, editor: User, observer: User, board: Board}
     */
    private function prepareFixture(KernelBrowser $client): array
    {
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $em->getClassMetadata(User::class),
            $em->getClassMetadata(\App\Entity\RefreshToken::class),
            $em->getClassMetadata(\Main\Entity\User\Access::class),
            $em->getClassMetadata(\Main\Entity\Claimant::class),
            $em->getClassMetadata(\App\Entity\UserSetting::class),
            $em->getClassMetadata(Workspace::class),
            $em->getClassMetadata(WorkspaceMember::class),
            $em->getClassMetadata(Board::class),
            $em->getClassMetadata(BoardMember::class),
            $em->getClassMetadata(BoardList::class),
            $em->getClassMetadata(Card::class),
            $em->getClassMetadata(Label::class),
            $em->getClassMetadata(Checklist::class),
            $em->getClassMetadata(ChecklistItem::class),
            $em->getClassMetadata(Comment::class),
            $em->getClassMetadata(Attachment::class),
            $em->getClassMetadata(ActivityLog::class),
            $em->getClassMetadata(\Main\Entity\File::class),
        ];
        $schemaTool = new SchemaTool($em);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $owner = $this->createTestUser($client, 'bm_owner', 'password', ['ROLE_USER']);
        $editor = $this->createTestUser($client, 'bm_editor', 'password', ['ROLE_USER']);
        $observer = $this->createTestUser($client, 'bm_observer', 'password', ['ROLE_USER']);

        $workspace = new Workspace();
        $workspace->setOwner($owner);
        $workspace->setName('WS');
        $workspace->addMember($this->workspaceMember($editor, MemberRole::Editor));
        $workspace->addMember($this->workspaceMember($observer, MemberRole::Observer));

        $board = new Board();
        $board->setWorkspace($workspace);
        $board->setTitle('Board');
        $board->setVisibility(Board::VISIBILITY_WORKSPACE);
        $board->setCreatedBy($owner);
        $workspace->addBoard($board);

        $em->persist($workspace);
        $em->persist($board);
        $em->flush();

        return [
            'owner' => $owner,
            'editor' => $editor,
            'observer' => $observer,
            'board' => $board,
        ];
    }

    private function workspaceMember(User $user, MemberRole $role): WorkspaceMember
    {
        $member = new WorkspaceMember();
        $member->setUser($user);
        $member->setRole($role);

        return $member;
    }
}

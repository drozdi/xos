<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260925210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Board attachment file_id; Todo item calendar_event_id';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('board_attachment') && !$this->columnExists('board_attachment', 'file_id')) {
            $this->addSql('ALTER TABLE board_attachment ADD file_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_board_attachment_file ON board_attachment (file_id)');
        }

        if ($this->tableExists('todo_item') && !$this->columnExists('todo_item', 'calendar_event_id')) {
            $this->addSql('ALTER TABLE todo_item ADD calendar_event_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_todo_item_calendar_event ON todo_item (calendar_event_id)');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('board_attachment') && $this->columnExists('board_attachment', 'file_id')) {
            $this->addSql('DROP INDEX IDX_board_attachment_file ON board_attachment');
            $this->addSql('ALTER TABLE board_attachment DROP file_id');
        }

        if ($this->tableExists('todo_item') && $this->columnExists('todo_item', 'calendar_event_id')) {
            $this->addSql('DROP INDEX IDX_todo_item_calendar_event ON todo_item');
            $this->addSql('ALTER TABLE todo_item DROP calendar_event_id');
        }
    }

    private function tableExists(string $table): bool
    {
        return $this->connection->createSchemaManager()->tablesExist([$table]);
    }

    private function columnExists(string $table, string $column): bool
    {
        $sm = $this->connection->createSchemaManager();
        if (!$sm->tablesExist([$table])) {
            return false;
        }

        return \array_key_exists($column, $sm->listTableColumns($table));
    }
}

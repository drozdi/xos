<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261023220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add due date to a todo note';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE todo_list ADD due_at DATETIME DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_TODO_LIST_DUE ON todo_list (due_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_TODO_LIST_DUE ON todo_list');
        $this->addSql('ALTER TABLE todo_list DROP due_at');
    }
}

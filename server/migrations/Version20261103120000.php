<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261103120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Board card index on list_id and updated_at for already deployed databases';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('board_card') && !$this->indexExists('board_card', 'IDX_BOARD_CARD_LIST_UPDATED')) {
            $this->addSql('CREATE INDEX IDX_BOARD_CARD_LIST_UPDATED ON board_card (list_id, updated_at)');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('board_card') && $this->indexExists('board_card', 'IDX_BOARD_CARD_LIST_UPDATED')) {
            $this->addSql('DROP INDEX IDX_BOARD_CARD_LIST_UPDATED ON board_card');
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
            [$table, $indexName],
        ) > 0;
    }
}

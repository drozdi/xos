<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260904120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Board card PKB note link: pkb_vault_id, pkb_note_path';
    }

    public function up(Schema $schema): void
    {
        if (!$this->columnExists('board_card', 'pkb_vault_id')) {
            $this->addSql('ALTER TABLE board_card ADD pkb_vault_id INT DEFAULT NULL');
        }
        if (!$this->columnExists('board_card', 'pkb_note_path')) {
            $this->addSql('ALTER TABLE board_card ADD pkb_note_path VARCHAR(512) DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->columnExists('board_card', 'pkb_note_path')) {
            $this->addSql('ALTER TABLE board_card DROP pkb_note_path');
        }
        if ($this->columnExists('board_card', 'pkb_vault_id')) {
            $this->addSql('ALTER TABLE board_card DROP pkb_vault_id');
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
            [$table, $column],
        ) > 0;
    }
}

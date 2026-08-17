<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * PKB Phase 1: pkb_vault table.
 *
 * Idempotent: skips objects that already exist (recovery after partial apply).
 */
final class Version20260817160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create pkb_vault table';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('pkb_vault')) {
            $this->addSql('CREATE TABLE pkb_vault (
                id INT AUTO_INCREMENT NOT NULL,
                owner_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(64) NOT NULL,
                root_path VARCHAR(512) NOT NULL,
                is_personal TINYINT(1) DEFAULT 1 NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                index_version INT DEFAULT 0 NOT NULL,
                index_stale TINYINT(1) DEFAULT 0 NOT NULL,
                INDEX IDX_pkb_vault_owner (owner_id),
                UNIQUE INDEX UNIQ_pkb_vault_owner_slug (owner_id, slug),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }

        if (!$this->foreignKeyExists('pkb_vault', 'FK_pkb_vault_owner')) {
            $this->addSql('ALTER TABLE pkb_vault ADD CONSTRAINT FK_pkb_vault_owner FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE RESTRICT');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->foreignKeyExists('pkb_vault', 'FK_pkb_vault_owner')) {
            $this->addSql('ALTER TABLE pkb_vault DROP FOREIGN KEY FK_pkb_vault_owner');
        }

        if ($this->tableExists('pkb_vault')) {
            $this->addSql('DROP TABLE pkb_vault');
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }

    private function foreignKeyExists(string $table, string $constraintName): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.table_constraints
             WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = ?',
            [$table, $constraintName, 'FOREIGN KEY'],
        ) > 0;
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * PKB Phase 5: pkb_vault_member table.
 *
 * Idempotent: skips objects that already exist (recovery after partial apply).
 */
final class Version20260817180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create pkb_vault_member table';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('pkb_vault_member')) {
            $this->addSql("CREATE TABLE pkb_vault_member (
                id INT AUTO_INCREMENT NOT NULL,
                vault_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('reader', 'editor') NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX IDX_pkb_vault_member_vault (vault_id),
                INDEX IDX_pkb_vault_member_user (user_id),
                UNIQUE INDEX UNIQ_pkb_vault_member_vault_user (vault_id, user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        }

        if (!$this->foreignKeyExists('pkb_vault_member', 'FK_pkb_vault_member_vault')) {
            $this->addSql('ALTER TABLE pkb_vault_member ADD CONSTRAINT FK_pkb_vault_member_vault FOREIGN KEY (vault_id) REFERENCES pkb_vault (id) ON DELETE CASCADE');
        }

        if (!$this->foreignKeyExists('pkb_vault_member', 'FK_pkb_vault_member_user')) {
            $this->addSql('ALTER TABLE pkb_vault_member ADD CONSTRAINT FK_pkb_vault_member_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->foreignKeyExists('pkb_vault_member', 'FK_pkb_vault_member_user')) {
            $this->addSql('ALTER TABLE pkb_vault_member DROP FOREIGN KEY FK_pkb_vault_member_user');
        }

        if ($this->foreignKeyExists('pkb_vault_member', 'FK_pkb_vault_member_vault')) {
            $this->addSql('ALTER TABLE pkb_vault_member DROP FOREIGN KEY FK_pkb_vault_member_vault');
        }

        if ($this->tableExists('pkb_vault_member')) {
            $this->addSql('DROP TABLE pkb_vault_member');
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

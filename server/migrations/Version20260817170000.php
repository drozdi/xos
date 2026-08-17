<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * PKB Phase 3: pkb_note_index + pkb_link tables.
 *
 * Idempotent: skips objects that already exist (recovery after partial apply).
 */
final class Version20260817170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create pkb_note_index and pkb_link tables';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('pkb_note_index')) {
            $this->addSql('CREATE TABLE pkb_note_index (
                id INT AUTO_INCREMENT NOT NULL,
                vault_id INT NOT NULL,
                path VARCHAR(512) NOT NULL,
                title VARCHAR(255) NOT NULL,
                tags JSON NOT NULL,
                outbound_count INT DEFAULT 0 NOT NULL,
                inbound_count INT DEFAULT 0 NOT NULL,
                content_hash CHAR(64) NOT NULL,
                body_excerpt VARCHAR(500) DEFAULT NULL,
                mtime DATETIME NOT NULL,
                indexed_at DATETIME NOT NULL,
                INDEX IDX_pkb_note_vault_title (vault_id, title),
                UNIQUE INDEX UNIQ_pkb_note_vault_path (vault_id, path),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }

        if (!$this->foreignKeyExists('pkb_note_index', 'FK_pkb_note_index_vault')) {
            $this->addSql('ALTER TABLE pkb_note_index ADD CONSTRAINT FK_pkb_note_index_vault FOREIGN KEY (vault_id) REFERENCES pkb_vault (id) ON DELETE CASCADE');
        }

        if (!$this->indexExists('pkb_note_index', 'FTIDX_pkb_note_search') && $this->supportsFulltext()) {
            $this->addSql('ALTER TABLE pkb_note_index ADD FULLTEXT INDEX FTIDX_pkb_note_search (title, body_excerpt)');
        }

        if (!$this->tableExists('pkb_link')) {
            $this->addSql("CREATE TABLE pkb_link (
                id INT AUTO_INCREMENT NOT NULL,
                vault_id INT NOT NULL,
                source_path VARCHAR(512) NOT NULL,
                target_key VARCHAR(255) NOT NULL,
                target_path VARCHAR(512) DEFAULT NULL,
                link_type ENUM('wikilink', 'embed', 'tag') NOT NULL,
                alias VARCHAR(255) DEFAULT NULL,
                position INT DEFAULT NULL,
                INDEX IDX_pkb_link_target (vault_id, target_key),
                INDEX IDX_pkb_link_source (vault_id, source_path),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        }

        if (!$this->foreignKeyExists('pkb_link', 'FK_pkb_link_vault')) {
            $this->addSql('ALTER TABLE pkb_link ADD CONSTRAINT FK_pkb_link_vault FOREIGN KEY (vault_id) REFERENCES pkb_vault (id) ON DELETE CASCADE');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->foreignKeyExists('pkb_link', 'FK_pkb_link_vault')) {
            $this->addSql('ALTER TABLE pkb_link DROP FOREIGN KEY FK_pkb_link_vault');
        }

        if ($this->tableExists('pkb_link')) {
            $this->addSql('DROP TABLE pkb_link');
        }

        if ($this->indexExists('pkb_note_index', 'FTIDX_pkb_note_search')) {
            $this->addSql('ALTER TABLE pkb_note_index DROP INDEX FTIDX_pkb_note_search');
        }

        if ($this->foreignKeyExists('pkb_note_index', 'FK_pkb_note_index_vault')) {
            $this->addSql('ALTER TABLE pkb_note_index DROP FOREIGN KEY FK_pkb_note_index_vault');
        }

        if ($this->tableExists('pkb_note_index')) {
            $this->addSql('DROP TABLE pkb_note_index');
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

    private function indexExists(string $table, string $indexName): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
            [$table, $indexName],
        ) > 0;
    }

    private function supportsFulltext(): bool
    {
        try {
            $version = (string) $this->connection->fetchOne('SELECT VERSION()');
            if (str_contains(strtolower($version), 'mariadb')) {
                return version_compare(preg_replace('/[^0-9.].*$/', '', $version) ?: '0', '10.0.5', '>=');
            }

            return version_compare(preg_replace('/[^0-9.].*$/', '', $version) ?: '0', '5.6.0', '>=');
        } catch (\Throwable) {
            return false;
        }
    }
}

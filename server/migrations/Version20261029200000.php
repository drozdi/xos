<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261029200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock prototype properties: parent_scope unique and element property group_index';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_property') && !$this->columnExists('iblock_property', 'parent_scope')) {
            $this->addSql('ALTER TABLE iblock_property ADD parent_scope INT NOT NULL DEFAULT 0');
            $this->addSql('UPDATE iblock_property SET parent_scope = IFNULL(parent_id, 0)');
        }
        if ($this->tableExists('iblock_property') && $this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_CODE')) {
            $this->addSql('DROP INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_CODE ON iblock_property');
        }
        if ($this->tableExists('iblock_property') && !$this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_SCOPE_CODE')) {
            $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_SCOPE_CODE ON iblock_property (block_id, parent_scope, code)');
        }
        if ($this->tableExists('iblock_element_property') && !$this->columnExists('iblock_element_property', 'group_index')) {
            $this->addSql('ALTER TABLE iblock_element_property ADD group_index INT NOT NULL DEFAULT 0');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_element_property') && $this->columnExists('iblock_element_property', 'group_index')) {
            $this->addSql('ALTER TABLE iblock_element_property DROP group_index');
        }
        if ($this->tableExists('iblock_property') && $this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_SCOPE_CODE')) {
            $this->addSql('DROP INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_SCOPE_CODE ON iblock_property');
        }
        if ($this->tableExists('iblock_property') && !$this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_CODE')) {
            $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_CODE ON iblock_property (block_id, code)');
        }
        if ($this->tableExists('iblock_property') && $this->columnExists('iblock_property', 'parent_scope')) {
            $this->addSql('ALTER TABLE iblock_property DROP parent_scope');
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

    private function columnExists(string $table, string $column): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
            [$table, $column],
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

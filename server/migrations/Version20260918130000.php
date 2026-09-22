<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260918130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: composite unique (type_id,code)/(block_id,code) instead of global code UNIQUE';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_block')) {
            $this->dropUniqueIndexesOnColumns('iblock_block', ['code']);
            if (!$this->indexExists('iblock_block', 'UNIQ_IBLOCK_BLOCK_TYPE_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_BLOCK_TYPE_CODE ON iblock_block (type_id, code)');
            }
        }

        if ($this->tableExists('iblock_section')) {
            $this->dropUniqueIndexesOnColumns('iblock_section', ['code']);
            if (!$this->indexExists('iblock_section', 'UNIQ_IBLOCK_SECTION_BLOCK_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_SECTION_BLOCK_CODE ON iblock_section (block_id, code)');
            }
        }

        if ($this->tableExists('iblock_element')) {
            $this->dropUniqueIndexesOnColumns('iblock_element', ['code']);
            if (!$this->indexExists('iblock_element', 'UNIQ_IBLOCK_ELEMENT_BLOCK_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_ELEMENT_BLOCK_CODE ON iblock_element (block_id, code)');
            }
        }

        if ($this->tableExists('iblock_property')) {
            $this->dropUniqueIndexesOnColumns('iblock_property', ['code']);
            if (!$this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_CODE ON iblock_property (block_id, code)');
            }
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_block') && $this->indexExists('iblock_block', 'UNIQ_IBLOCK_BLOCK_TYPE_CODE')) {
            $this->addSql('DROP INDEX UNIQ_IBLOCK_BLOCK_TYPE_CODE ON iblock_block');
            if (!$this->indexExists('iblock_block', 'UNIQ_IBLOCK_BLOCK_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_BLOCK_CODE ON iblock_block (code)');
            }
        }

        if ($this->tableExists('iblock_section') && $this->indexExists('iblock_section', 'UNIQ_IBLOCK_SECTION_BLOCK_CODE')) {
            $this->addSql('DROP INDEX UNIQ_IBLOCK_SECTION_BLOCK_CODE ON iblock_section');
            if (!$this->indexExists('iblock_section', 'UNIQ_IBLOCK_SECTION_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_SECTION_CODE ON iblock_section (code)');
            }
        }

        if ($this->tableExists('iblock_element') && $this->indexExists('iblock_element', 'UNIQ_IBLOCK_ELEMENT_BLOCK_CODE')) {
            $this->addSql('DROP INDEX UNIQ_IBLOCK_ELEMENT_BLOCK_CODE ON iblock_element');
            if (!$this->indexExists('iblock_element', 'UNIQ_IBLOCK_ELEMENT_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_ELEMENT_CODE ON iblock_element (code)');
            }
        }

        if ($this->tableExists('iblock_property') && $this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_CODE')) {
            $this->addSql('DROP INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_CODE ON iblock_property');
            if (!$this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_CODE ON iblock_property (code)');
            }
        }
    }

    /** @param list<string> $columns */
    private function dropUniqueIndexesOnColumns(string $table, array $columns): void
    {
        $indexes = $this->connection->fetchFirstColumn(
            'SELECT DISTINCT INDEX_NAME FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = ? AND NON_UNIQUE = 0 AND INDEX_NAME <> ?',
            [$table, 'PRIMARY'],
        );
        foreach ($indexes as $indexName) {
            $cols = $this->connection->fetchFirstColumn(
                'SELECT COLUMN_NAME FROM information_schema.statistics
                 WHERE table_schema = DATABASE() AND table_name = ? AND INDEX_NAME = ?
                 ORDER BY SEQ_IN_INDEX',
                [$table, $indexName],
            );
            if ($cols === $columns) {
                $this->addSql(sprintf('DROP INDEX `%s` ON %s', $indexName, $table));
            }
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

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260915150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: Property owned by Block only — drop Type links, require block_id, unique(block_id, code)';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_property')) {
            $this->addSql('DELETE FROM iblock_property WHERE block_id IS NULL');

            $this->dropForeignKeysOnColumn('iblock_property', 'type_id');
            if ($this->columnExists('iblock_property', 'type_id')) {
                $this->addSql('ALTER TABLE iblock_property DROP type_id');
            }

            $this->dropUniqueIndexesOnColumns('iblock_property', ['code']);

            if ($this->columnExists('iblock_property', 'block_id')) {
                $this->addSql('ALTER TABLE iblock_property MODIFY block_id INT NOT NULL');
            }

            if (!$this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_CODE ON iblock_property (block_id, code)');
            }
        }

        if ($this->tableExists('iblock_type_property')) {
            $this->addSql('DROP TABLE iblock_type_property');
        }

        if ($this->tableExists('iblock_type') && $this->columnExists('iblock_type', 'property_id')) {
            $this->dropForeignKeysOnColumn('iblock_type', 'property_id');
            $this->addSql('ALTER TABLE iblock_type DROP property_id');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_type') && !$this->columnExists('iblock_type', 'property_id')) {
            $this->addSql('ALTER TABLE iblock_type ADD property_id INT DEFAULT NULL');
            $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_TYPE_PROPERTY ON iblock_type (property_id)');
            $this->addSql('ALTER TABLE iblock_type ADD CONSTRAINT FK_IBLOCK_TYPE_PROPERTY
                FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
        }

        if (!$this->tableExists('iblock_type_property') && $this->tableExists('iblock_type') && $this->tableExists('iblock_property')) {
            $this->addSql('CREATE TABLE iblock_type_property (
                type_id INT NOT NULL,
                property_id INT NOT NULL,
                INDEX IDX_IBLOCK_TYPE_PROP_TYPE (type_id),
                INDEX IDX_IBLOCK_TYPE_PROP_PROP (property_id),
                PRIMARY KEY(type_id, property_id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE iblock_type_property ADD CONSTRAINT FK_IBLOCK_TP_TYPE
                FOREIGN KEY (type_id) REFERENCES iblock_type (id) ON DELETE CASCADE');
            $this->addSql('ALTER TABLE iblock_type_property ADD CONSTRAINT FK_IBLOCK_TP_PROP
                FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
        }

        if ($this->tableExists('iblock_property')) {
            if ($this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_BLOCK_CODE')) {
                $this->addSql('DROP INDEX UNIQ_IBLOCK_PROPERTY_BLOCK_CODE ON iblock_property');
            }
            if ($this->columnExists('iblock_property', 'block_id')) {
                $this->addSql('ALTER TABLE iblock_property MODIFY block_id INT DEFAULT NULL');
            }
            if (!$this->columnExists('iblock_property', 'type_id')) {
                $this->addSql('ALTER TABLE iblock_property ADD type_id INT DEFAULT NULL');
            }
            if (!$this->indexExists('iblock_property', 'UNIQ_IBLOCK_PROPERTY_CODE')) {
                $this->addSql('CREATE UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_CODE ON iblock_property (code)');
            }
        }
    }

    private function dropForeignKeysOnColumn(string $table, string $column): void
    {
        $names = $this->connection->fetchFirstColumn(
            'SELECT DISTINCT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
               AND referenced_table_name IS NOT NULL',
            [$table, $column],
        );
        foreach ($names as $name) {
            $this->addSql(sprintf('ALTER TABLE %s DROP FOREIGN KEY %s', $table, $name));
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

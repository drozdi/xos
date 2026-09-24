<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260924220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: preview_image + detail_image (FK main_file) on block, element, section';
    }

    public function up(Schema $schema): void
    {
        $this->addImageColumns('iblock_block', 'IBLOCK_BLOCK');
        $this->addImageColumns('iblock_element', 'IBLOCK_ELEMENT');
        $this->addImageColumns('iblock_section', 'IBLOCK_SECTION');
    }

    public function down(Schema $schema): void
    {
        $this->dropImageColumns('iblock_block', 'IBLOCK_BLOCK');
        $this->dropImageColumns('iblock_element', 'IBLOCK_ELEMENT');
        $this->dropImageColumns('iblock_section', 'IBLOCK_SECTION');
    }

    private function addImageColumns(string $table, string $fkPrefix): void
    {
        if (!$this->tableExists($table)) {
            return;
        }
        if (!$this->columnExists($table, 'preview_image_id')) {
            $this->addSql(sprintf('ALTER TABLE %s ADD preview_image_id INT DEFAULT NULL', $table));
            $this->addSql(sprintf(
                'ALTER TABLE %s ADD CONSTRAINT FK_%s_PREVIEW_IMAGE FOREIGN KEY (preview_image_id) REFERENCES main_file (id) ON DELETE SET NULL',
                $table,
                $fkPrefix,
            ));
            $this->addSql(sprintf('CREATE INDEX IDX_%s_PREVIEW_IMAGE ON %s (preview_image_id)', $fkPrefix, $table));
        }
        if (!$this->columnExists($table, 'detail_image_id')) {
            $this->addSql(sprintf('ALTER TABLE %s ADD detail_image_id INT DEFAULT NULL', $table));
            $this->addSql(sprintf(
                'ALTER TABLE %s ADD CONSTRAINT FK_%s_DETAIL_IMAGE FOREIGN KEY (detail_image_id) REFERENCES main_file (id) ON DELETE SET NULL',
                $table,
                $fkPrefix,
            ));
            $this->addSql(sprintf('CREATE INDEX IDX_%s_DETAIL_IMAGE ON %s (detail_image_id)', $fkPrefix, $table));
        }
    }

    private function dropImageColumns(string $table, string $fkPrefix): void
    {
        if (!$this->tableExists($table)) {
            return;
        }
        if ($this->columnExists($table, 'detail_image_id')) {
            $this->addSql(sprintf('ALTER TABLE %s DROP FOREIGN KEY FK_%s_DETAIL_IMAGE', $table, $fkPrefix));
            $this->addSql(sprintf('DROP INDEX IDX_%s_DETAIL_IMAGE ON %s', $fkPrefix, $table));
            $this->addSql(sprintf('ALTER TABLE %s DROP detail_image_id', $table));
        }
        if ($this->columnExists($table, 'preview_image_id')) {
            $this->addSql(sprintf('ALTER TABLE %s DROP FOREIGN KEY FK_%s_PREVIEW_IMAGE', $table, $fkPrefix));
            $this->addSql(sprintf('DROP INDEX IDX_%s_PREVIEW_IMAGE ON %s', $fkPrefix, $table));
            $this->addSql(sprintf('ALTER TABLE %s DROP preview_image_id', $table));
        }
    }

    private function tableExists(string $table): bool
    {
        $sm = $this->connection->createSchemaManager();

        return $sm->tablesExist([$table]);
    }

    private function columnExists(string $table, string $column): bool
    {
        $sm = $this->connection->createSchemaManager();
        if (!$sm->tablesExist([$table])) {
            return false;
        }
        $columns = $sm->listTableColumns($table);

        return isset($columns[$column]);
    }
}

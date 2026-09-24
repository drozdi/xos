<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260924230000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock property: file_type restriction for field_type F';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('iblock_property')) {
            return;
        }
        if ($this->columnExists('iblock_property', 'file_type')) {
            return;
        }
        $this->addSql('ALTER TABLE iblock_property ADD file_type VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('iblock_property')) {
            return;
        }
        if (!$this->columnExists('iblock_property', 'file_type')) {
            return;
        }
        $this->addSql('ALTER TABLE iblock_property DROP file_type');
    }

    private function tableExists(string $table): bool
    {
        return $this->connection->createSchemaManager()->tablesExist([$table]);
    }

    private function columnExists(string $table, string $column): bool
    {
        $sm = $this->connection->createSchemaManager();
        if (!$sm->tablesExist([$table])) {
            return false;
        }

        return isset($sm->listTableColumns($table)[$column]);
    }
}

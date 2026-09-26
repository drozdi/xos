<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'PKB vault encrypt_at_rest + plugins_json';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('pkb_vault')) {
            return;
        }

        if (!$this->columnExists('pkb_vault', 'encrypt_at_rest')) {
            $this->addSql('ALTER TABLE pkb_vault ADD encrypt_at_rest TINYINT(1) DEFAULT 0 NOT NULL');
        }

        if (!$this->columnExists('pkb_vault', 'plugins_json')) {
            $this->addSql('ALTER TABLE pkb_vault ADD plugins_json JSON DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('pkb_vault')) {
            return;
        }

        if ($this->columnExists('pkb_vault', 'plugins_json')) {
            $this->addSql('ALTER TABLE pkb_vault DROP plugins_json');
        }

        if ($this->columnExists('pkb_vault', 'encrypt_at_rest')) {
            $this->addSql('ALTER TABLE pkb_vault DROP encrypt_at_rest');
        }
    }

    private function tableExists(string $table): bool
    {
        return $this->connection->createSchemaManager()->tablesExist([$table]);
    }

    private function columnExists(string $table, string $column): bool
    {
        $columns = $this->connection->createSchemaManager()->listTableColumns($table);

        return isset($columns[$column]);
    }
}

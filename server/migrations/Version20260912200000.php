<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260912200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'TeamStorm credential ts_username for mine filter';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('ts_user_credential') && !$this->columnExists('ts_user_credential', 'ts_username')) {
            $this->addSql('ALTER TABLE ts_user_credential ADD ts_username VARCHAR(255) DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->columnExists('ts_user_credential', 'ts_username')) {
            $this->addSql('ALTER TABLE ts_user_credential DROP ts_username');
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
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
}

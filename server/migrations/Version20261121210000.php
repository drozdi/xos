<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Mark which main users belong in the domain';
    }

    public function up(Schema $schema): void
    {
        if (!$this->columnExists('main_user', 'domain')) {
            $this->addSql('ALTER TABLE main_user ADD domain TINYINT(1) DEFAULT 0 NOT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->columnExists('main_user', 'domain')) {
            $this->addSql('ALTER TABLE main_user DROP domain');
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$table, $column],
        ) > 0;
    }
}

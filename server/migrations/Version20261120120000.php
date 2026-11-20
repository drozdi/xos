<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261120120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Samba directory snapshot';
    }

    public function up(Schema $schema): void
    {
        if ($this->columnExists('samba_server', 'directory_snapshot')) {
            return;
        }
        $this->addSql('ALTER TABLE samba_server ADD directory_snapshot JSON DEFAULT NULL, ADD directory_synced_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        if (!$this->columnExists('samba_server', 'directory_snapshot')) {
            return;
        }
        $this->addSql('ALTER TABLE samba_server DROP directory_snapshot, DROP directory_synced_at');
    }

    private function columnExists(string $table, string $column): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$table, $column],
        ) > 0;
    }
}

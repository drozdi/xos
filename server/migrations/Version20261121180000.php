<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Samba import field map';
    }

    public function up(Schema $schema): void
    {
        if (!$this->columnExists('samba_server', 'import_map')) {
            $this->addSql('ALTER TABLE samba_server ADD import_map JSON DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->columnExists('samba_server', 'import_map')) {
            $this->addSql('ALTER TABLE samba_server DROP import_map');
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

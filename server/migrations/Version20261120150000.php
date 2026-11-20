<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261120150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Samba agent install token';
    }

    public function up(Schema $schema): void
    {
        if (!$this->columnExists('samba_server', 'agent_token')) {
            $this->addSql('ALTER TABLE samba_server ADD agent_token LONGTEXT DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->columnExists('samba_server', 'agent_token')) {
            $this->addSql('ALTER TABLE samba_server DROP agent_token');
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

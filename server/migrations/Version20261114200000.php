<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261114200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Samba agent credentials and enrollment lookup';
    }

    public function up(Schema $schema): void
    {
        if (!$this->columnExists('samba_server', 'time_skew_ms')) {
            $this->addSql('ALTER TABLE samba_server ADD time_skew_ms INT DEFAULT NULL, ADD agent_version VARCHAR(32) DEFAULT NULL, ADD protocol_version VARCHAR(16) DEFAULT NULL');
        }
        if (!$this->columnExists('samba_enrollment', 'lookup')) {
            $this->addSql("ALTER TABLE samba_enrollment ADD lookup VARCHAR(16) NOT NULL DEFAULT ''");
        }
        if (!$this->tableExists('samba_agent_credential')) {
            $this->addSql('CREATE TABLE samba_agent_credential (id INT AUTO_INCREMENT NOT NULL, server_id INT NOT NULL, kind VARCHAR(16) NOT NULL, lookup VARCHAR(16) NOT NULL, secret_hash VARCHAR(255) NOT NULL, seal_public_key LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, revoked_at DATETIME DEFAULT NULL, INDEX IDX_samba_agent_lookup (lookup), INDEX IDX_samba_agent_server (server_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE samba_agent_credential ADD CONSTRAINT FK_samba_agent_server FOREIGN KEY (server_id) REFERENCES samba_server (id) ON DELETE CASCADE');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('samba_agent_credential')) {
            $this->addSql('ALTER TABLE samba_agent_credential DROP FOREIGN KEY FK_samba_agent_server');
            $this->addSql('DROP TABLE samba_agent_credential');
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
            'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
            [$table, $column],
        ) > 0;
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261025201000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'SSH key manager';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('ssh_key')) {
            $this->addSql('CREATE TABLE ssh_key (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                name VARCHAR(120) NOT NULL,
                type VARCHAR(16) NOT NULL,
                private_key LONGTEXT NOT NULL,
                public_key LONGTEXT NOT NULL,
                passphrase LONGTEXT DEFAULT NULL,
                fingerprint VARCHAR(128) NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX IDX_ssh_key_user (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE ssh_key
                ADD CONSTRAINT FK_ssh_key_user
                FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        }

        if ($this->tableExists('ssh_connection') && !$this->columnExists('ssh_connection', 'key_id')) {
            $this->addSql('ALTER TABLE ssh_connection ADD key_id INT DEFAULT NULL');
            $this->addSql('ALTER TABLE ssh_connection
                ADD CONSTRAINT FK_ssh_connection_key
                FOREIGN KEY (key_id) REFERENCES ssh_key (id) ON DELETE SET NULL');
            $this->addSql('CREATE INDEX IDX_ssh_connection_key ON ssh_connection (key_id)');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('ssh_connection') && $this->columnExists('ssh_connection', 'key_id')) {
            $this->addSql('ALTER TABLE ssh_connection DROP FOREIGN KEY FK_ssh_connection_key');
            $this->addSql('DROP INDEX IDX_ssh_connection_key ON ssh_connection');
            $this->addSql('ALTER TABLE ssh_connection DROP key_id');
        }
        if ($this->tableExists('ssh_key')) {
            $this->addSql('ALTER TABLE ssh_key DROP FOREIGN KEY FK_ssh_key_user');
            $this->addSql('DROP TABLE ssh_key');
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

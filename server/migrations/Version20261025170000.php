<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261025170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Saved SSH connections';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('ssh_connection')) {
            return;
        }

        $this->addSql('CREATE TABLE ssh_connection (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            name VARCHAR(120) NOT NULL,
            host VARCHAR(255) NOT NULL,
            port INT NOT NULL,
            username VARCHAR(128) NOT NULL,
            auth VARCHAR(16) NOT NULL,
            secret LONGTEXT NOT NULL,
            passphrase LONGTEXT DEFAULT NULL,
            host_key_fingerprint VARCHAR(128) DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_ssh_connection_user (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ssh_connection
            ADD CONSTRAINT FK_ssh_connection_user
            FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('ssh_connection')) {
            return;
        }

        $this->addSql('ALTER TABLE ssh_connection DROP FOREIGN KEY FK_ssh_connection_user');
        $this->addSql('DROP TABLE ssh_connection');
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }
}

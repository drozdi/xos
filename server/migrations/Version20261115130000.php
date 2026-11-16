<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261115130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Samba command queue';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('samba_command')) {
            return;
        }

        $this->addSql('CREATE TABLE samba_command (id INT AUTO_INCREMENT NOT NULL, server_id INT NOT NULL, author_id INT DEFAULT NULL, author_label VARCHAR(255) NOT NULL, type VARCHAR(32) NOT NULL, args JSON NOT NULL, sealed LONGTEXT DEFAULT NULL, status VARCHAR(16) NOT NULL, result LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, finished_at DATETIME DEFAULT NULL, INDEX IDX_samba_command_queue (server_id, status), INDEX IDX_samba_command_author (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE samba_command ADD CONSTRAINT FK_samba_command_server FOREIGN KEY (server_id) REFERENCES samba_server (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE samba_command ADD CONSTRAINT FK_samba_command_author FOREIGN KEY (author_id) REFERENCES main_user (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('samba_command')) {
            return;
        }
        $this->addSql('ALTER TABLE samba_command DROP FOREIGN KEY FK_samba_command_server');
        $this->addSql('ALTER TABLE samba_command DROP FOREIGN KEY FK_samba_command_author');
        $this->addSql('DROP TABLE samba_command');
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }
}

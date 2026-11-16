<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261114180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Samba servers, shared access and enrollment slots';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('samba_server')) {
            return;
        }

        $this->addSql('CREATE TABLE samba_server (id INT AUTO_INCREMENT NOT NULL, owner_id INT NOT NULL, created_by INT DEFAULT NULL, name VARCHAR(120) NOT NULL, description LONGTEXT DEFAULT NULL, role VARCHAR(16) NOT NULL, capabilities JSON NOT NULL, status VARCHAR(16) NOT NULL, expected_timezone VARCHAR(64) NOT NULL, detected JSON DEFAULT NULL, last_seen_at DATETIME DEFAULT NULL, generation INT NOT NULL, applied_generation INT NOT NULL, device_id INT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_samba_server_owner (owner_id), INDEX IDX_samba_server_author (created_by), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE samba_server_access (id INT AUTO_INCREMENT NOT NULL, server_id INT NOT NULL, user_id INT NOT NULL, rights INT NOT NULL, granted_by INT DEFAULT NULL, granted_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_samba_server_access (server_id, user_id), INDEX IDX_samba_access_server (server_id), INDEX IDX_samba_access_user (user_id), INDEX IDX_samba_access_author (granted_by), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE samba_enrollment (id INT AUTO_INCREMENT NOT NULL, server_id INT NOT NULL, token_hash VARCHAR(255) NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME DEFAULT NULL, created_by INT DEFAULT NULL, INDEX IDX_samba_enrollment_server (server_id), INDEX IDX_samba_enrollment_author (created_by), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE samba_server ADD CONSTRAINT FK_samba_server_owner FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE samba_server ADD CONSTRAINT FK_samba_server_author FOREIGN KEY (created_by) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE samba_server_access ADD CONSTRAINT FK_samba_access_server FOREIGN KEY (server_id) REFERENCES samba_server (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE samba_server_access ADD CONSTRAINT FK_samba_access_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE samba_server_access ADD CONSTRAINT FK_samba_access_author FOREIGN KEY (granted_by) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE samba_enrollment ADD CONSTRAINT FK_samba_enrollment_server FOREIGN KEY (server_id) REFERENCES samba_server (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE samba_enrollment ADD CONSTRAINT FK_samba_enrollment_author FOREIGN KEY (created_by) REFERENCES main_user (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('samba_server')) {
            return;
        }
        $this->addSql('ALTER TABLE samba_enrollment DROP FOREIGN KEY FK_samba_enrollment_server');
        $this->addSql('ALTER TABLE samba_enrollment DROP FOREIGN KEY FK_samba_enrollment_author');
        $this->addSql('ALTER TABLE samba_server_access DROP FOREIGN KEY FK_samba_access_server');
        $this->addSql('ALTER TABLE samba_server_access DROP FOREIGN KEY FK_samba_access_user');
        $this->addSql('ALTER TABLE samba_server_access DROP FOREIGN KEY FK_samba_access_author');
        $this->addSql('ALTER TABLE samba_server DROP FOREIGN KEY FK_samba_server_owner');
        $this->addSql('ALTER TABLE samba_server DROP FOREIGN KEY FK_samba_server_author');
        $this->addSql('DROP TABLE samba_enrollment');
        $this->addSql('DROP TABLE samba_server_access');
        $this->addSql('DROP TABLE samba_server');
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }
}

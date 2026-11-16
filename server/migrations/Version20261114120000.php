<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261114120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'RDP connections, allowed networks and the local guacd node';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('rdp_connection')) {
            return;
        }

        $this->addSql('CREATE TABLE rdp_node (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, endpoint_host VARCHAR(255) NOT NULL, endpoint_port INT NOT NULL, tls_mode VARCHAR(16) NOT NULL, ca_fingerprint VARCHAR(128) DEFAULT NULL, status VARCHAR(16) NOT NULL, active TINYINT(1) NOT NULL, is_local TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE rdp_network (id INT AUTO_INCREMENT NOT NULL, node_id INT DEFAULT NULL, created_by INT DEFAULT NULL, name VARCHAR(120) NOT NULL, cidrs JSON NOT NULL, dns_suffixes JSON NOT NULL, active TINYINT(1) NOT NULL, description LONGTEXT DEFAULT NULL, allow_clipboard TINYINT(1) NOT NULL, allow_drive TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_rdp_network_node (node_id), INDEX IDX_rdp_network_author (created_by), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE rdp_network_grant (id INT AUTO_INCREMENT NOT NULL, network_id INT NOT NULL, group_id INT DEFAULT NULL, role VARCHAR(64) DEFAULT NULL, UNIQUE INDEX UNIQ_rdp_network_grant (network_id, group_id, role), INDEX IDX_rdp_grant_network (network_id), INDEX IDX_rdp_grant_group (group_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE rdp_connection (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, network_id INT DEFAULT NULL, node_id INT DEFAULT NULL, name VARCHAR(120) NOT NULL, host VARCHAR(255) NOT NULL, port INT NOT NULL, zone VARCHAR(16) NOT NULL, zone_detected VARCHAR(16) NOT NULL, username VARCHAR(128) NOT NULL, domain VARCHAR(128) NOT NULL, secret LONGTEXT NOT NULL, security VARCHAR(16) NOT NULL, ignore_cert TINYINT(1) NOT NULL, cert_fingerprint VARCHAR(128) DEFAULT NULL, width INT NOT NULL, height INT NOT NULL, dpi INT NOT NULL, color_depth INT NOT NULL, enable_clipboard TINYINT(1) NOT NULL, enable_audio TINYINT(1) NOT NULL, enable_drive TINYINT(1) NOT NULL, keyboard_layout VARCHAR(32) NOT NULL, resize_method VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_rdp_connection_user (user_id), INDEX IDX_rdp_connection_network (network_id), INDEX IDX_rdp_connection_node (node_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE rdp_network ADD CONSTRAINT FK_rdp_network_node FOREIGN KEY (node_id) REFERENCES rdp_node (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE rdp_network ADD CONSTRAINT FK_rdp_network_author FOREIGN KEY (created_by) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE rdp_network_grant ADD CONSTRAINT FK_rdp_grant_network FOREIGN KEY (network_id) REFERENCES rdp_network (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE rdp_network_grant ADD CONSTRAINT FK_rdp_grant_group FOREIGN KEY (group_id) REFERENCES main_group (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE rdp_connection ADD CONSTRAINT FK_rdp_connection_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE rdp_connection ADD CONSTRAINT FK_rdp_connection_network FOREIGN KEY (network_id) REFERENCES rdp_network (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE rdp_connection ADD CONSTRAINT FK_rdp_connection_node FOREIGN KEY (node_id) REFERENCES rdp_node (id) ON DELETE SET NULL');
        $this->addSql("INSERT INTO rdp_node (name, endpoint_host, endpoint_port, tls_mode, status, active, is_local, created_at, updated_at) VALUES ('local', 'guacd', 4822, 'none', 'unknown', 1, 1, NOW(), NOW())");
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('rdp_connection')) {
            return;
        }
        $this->addSql('ALTER TABLE rdp_connection DROP FOREIGN KEY FK_rdp_connection_user');
        $this->addSql('ALTER TABLE rdp_connection DROP FOREIGN KEY FK_rdp_connection_network');
        $this->addSql('ALTER TABLE rdp_connection DROP FOREIGN KEY FK_rdp_connection_node');
        $this->addSql('ALTER TABLE rdp_network_grant DROP FOREIGN KEY FK_rdp_grant_network');
        $this->addSql('ALTER TABLE rdp_network_grant DROP FOREIGN KEY FK_rdp_grant_group');
        $this->addSql('ALTER TABLE rdp_network DROP FOREIGN KEY FK_rdp_network_node');
        $this->addSql('ALTER TABLE rdp_network DROP FOREIGN KEY FK_rdp_network_author');
        $this->addSql('DROP TABLE rdp_connection');
        $this->addSql('DROP TABLE rdp_network_grant');
        $this->addSql('DROP TABLE rdp_network');
        $this->addSql('DROP TABLE rdp_node');
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }
}

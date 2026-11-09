<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261106120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Saved database, Docker, VNC and SSH tunnel connections';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('ops_link')) {
            return;
        }

        $this->addSql('CREATE TABLE ops_link (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, ssh_connection_id INT DEFAULT NULL, kind VARCHAR(16) NOT NULL, name VARCHAR(120) NOT NULL, host VARCHAR(255) NOT NULL, port INT NOT NULL, username VARCHAR(128) NOT NULL, secret LONGTEXT NOT NULL, driver VARCHAR(16) NOT NULL, database_name VARCHAR(128) NOT NULL, listen_port INT NOT NULL, target_host VARCHAR(255) NOT NULL, target_port INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_ops_link_user_kind (user_id, kind), INDEX IDX_ops_link_ssh (ssh_connection_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ops_link ADD CONSTRAINT FK_ops_link_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ops_link ADD CONSTRAINT FK_ops_link_ssh FOREIGN KEY (ssh_connection_id) REFERENCES ssh_connection (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        if (!$this->tableExists('ops_link')) {
            return;
        }

        $this->addSql('ALTER TABLE ops_link DROP FOREIGN KEY FK_ops_link_user');
        $this->addSql('ALTER TABLE ops_link DROP FOREIGN KEY FK_ops_link_ssh');
        $this->addSql('DROP TABLE ops_link');
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }
}

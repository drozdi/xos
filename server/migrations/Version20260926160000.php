<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Main audit log table main_audit_log';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('main_audit_log')) {
            return;
        }

        $this->addSql('CREATE TABLE main_audit_log (
            id INT AUTO_INCREMENT NOT NULL,
            created_at DATETIME NOT NULL,
            actor_id INT DEFAULT NULL,
            actor_label VARCHAR(255) NOT NULL,
            action VARCHAR(32) NOT NULL,
            entity_type VARCHAR(128) NOT NULL,
            entity_id INT DEFAULT NULL,
            summary VARCHAR(512) NOT NULL,
            payload JSON DEFAULT NULL,
            INDEX IDX_main_audit_log_created (created_at),
            INDEX IDX_main_audit_log_action (action),
            INDEX IDX_main_audit_log_entity (entity_type, entity_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('main_audit_log')) {
            $this->addSql('DROP TABLE main_audit_log');
        }
    }

    private function tableExists(string $table): bool
    {
        return $this->connection->createSchemaManager()->tablesExist([$table]);
    }
}

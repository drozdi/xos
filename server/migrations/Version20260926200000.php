<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'GitHub per-user credentials (PAT + default owner/repo)';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('github_user_credential')) {
            $this->addSql('CREATE TABLE github_user_credential (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                access_token LONGTEXT NOT NULL,
                default_owner VARCHAR(255) DEFAULT NULL,
                default_repo VARCHAR(255) DEFAULT NULL,
                github_login VARCHAR(255) DEFAULT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                UNIQUE INDEX uniq_github_user_credential_user (user_id),
                INDEX IDX_github_user_credential_user (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE github_user_credential
                ADD CONSTRAINT FK_github_user_credential_user
                FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('github_user_credential')) {
            $this->addSql('ALTER TABLE github_user_credential DROP FOREIGN KEY FK_github_user_credential_user');
            $this->addSql('DROP TABLE github_user_credential');
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }
}

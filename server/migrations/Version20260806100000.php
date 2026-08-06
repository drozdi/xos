<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Create user_app_data KV table for per-user opaque app prefs.
 */
final class Version20260806100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create user_app_data table (per-user opaque KV)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE user_app_data (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            code VARCHAR(191) NOT NULL,
            value JSON NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX uniq_user_app_data_user_code (user_id, code),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE user_app_data ADD CONSTRAINT FK_user_app_data_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_app_data DROP FOREIGN KEY FK_user_app_data_user');
        $this->addSql('DROP TABLE user_app_data');
    }
}

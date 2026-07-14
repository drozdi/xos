<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260714120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create user_settings table for client SettingManager ApiAdapter';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE user_settings (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                category VARCHAR(32) NOT NULL,
                setting_key VARCHAR(512) NOT NULL,
                value JSON NOT NULL,
                updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                INDEX idx_user_category (user_id, category),
                UNIQUE INDEX uniq_user_category_key (user_id, category, setting_key),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_settings ADD CONSTRAINT FK_user_settings_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_settings DROP FOREIGN KEY FK_user_settings_user');
        $this->addSql('DROP TABLE user_settings');
    }
}

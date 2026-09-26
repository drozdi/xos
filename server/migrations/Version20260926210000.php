<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Inbox internal messages (from/to/subject/body_md/read_at)';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('inbox_message')) {
            $this->addSql('CREATE TABLE inbox_message (
                id INT AUTO_INCREMENT NOT NULL,
                from_user_id INT NOT NULL,
                to_user_id INT NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body_md LONGTEXT NOT NULL,
                read_at DATETIME DEFAULT NULL,
                created_at DATETIME NOT NULL,
                INDEX IDX_inbox_message_to_user (to_user_id),
                INDEX IDX_inbox_message_from_user (from_user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE inbox_message
                ADD CONSTRAINT FK_inbox_message_from_user
                FOREIGN KEY (from_user_id) REFERENCES main_user (id) ON DELETE CASCADE');
            $this->addSql('ALTER TABLE inbox_message
                ADD CONSTRAINT FK_inbox_message_to_user
                FOREIGN KEY (to_user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('inbox_message')) {
            $this->addSql('ALTER TABLE inbox_message DROP FOREIGN KEY FK_inbox_message_from_user');
            $this->addSql('ALTER TABLE inbox_message DROP FOREIGN KEY FK_inbox_message_to_user');
            $this->addSql('DROP TABLE inbox_message');
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

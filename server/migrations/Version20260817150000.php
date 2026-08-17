<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Board Phase 3: board_checklist, board_checklist_item, board_attachment, board_comment, board_activity_log.
 */
final class Version20260817150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create board_checklist, board_checklist_item, board_attachment, board_comment, board_activity_log tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE board_checklist (
            id INT AUTO_INCREMENT NOT NULL,
            card_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            position INT NOT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_checklist_item (
            id INT AUTO_INCREMENT NOT NULL,
            checklist_id INT NOT NULL,
            text VARCHAR(512) NOT NULL,
            checked TINYINT(1) NOT NULL,
            position INT NOT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_attachment (
            id INT AUTO_INCREMENT NOT NULL,
            card_id INT NOT NULL,
            uploaded_by_id INT DEFAULT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_url VARCHAR(512) NOT NULL,
            mime_type VARCHAR(128) DEFAULT NULL,
            size_bytes INT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            INDEX IDX_board_attachment_card (card_id),
            INDEX IDX_board_attachment_uploaded_by (uploaded_by_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_comment (
            id INT AUTO_INCREMENT NOT NULL,
            card_id INT NOT NULL,
            user_id INT NOT NULL,
            text LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME DEFAULT NULL,
            INDEX IDX_board_comment_card_created (card_id, created_at),
            INDEX IDX_board_comment_user (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_activity_log (
            id INT AUTO_INCREMENT NOT NULL,
            board_id INT NOT NULL,
            card_id INT DEFAULT NULL,
            user_id INT DEFAULT NULL,
            action_type VARCHAR(32) NOT NULL,
            details JSON NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX IDX_board_activity_card (card_id, created_at),
            INDEX IDX_board_activity_board (board_id, created_at),
            INDEX IDX_board_activity_user (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE board_checklist ADD CONSTRAINT FK_board_checklist_card FOREIGN KEY (card_id) REFERENCES board_card (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_checklist_item ADD CONSTRAINT FK_board_checklist_item_checklist FOREIGN KEY (checklist_id) REFERENCES board_checklist (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_attachment ADD CONSTRAINT FK_board_attachment_card FOREIGN KEY (card_id) REFERENCES board_card (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_attachment ADD CONSTRAINT FK_board_attachment_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE board_comment ADD CONSTRAINT FK_board_comment_card FOREIGN KEY (card_id) REFERENCES board_card (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_comment ADD CONSTRAINT FK_board_comment_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_activity_log ADD CONSTRAINT FK_board_activity_log_board FOREIGN KEY (board_id) REFERENCES board_board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_activity_log ADD CONSTRAINT FK_board_activity_log_card FOREIGN KEY (card_id) REFERENCES board_card (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE board_activity_log ADD CONSTRAINT FK_board_activity_log_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE board_activity_log DROP FOREIGN KEY FK_board_activity_log_user');
        $this->addSql('ALTER TABLE board_activity_log DROP FOREIGN KEY FK_board_activity_log_card');
        $this->addSql('ALTER TABLE board_activity_log DROP FOREIGN KEY FK_board_activity_log_board');
        $this->addSql('ALTER TABLE board_comment DROP FOREIGN KEY FK_board_comment_user');
        $this->addSql('ALTER TABLE board_comment DROP FOREIGN KEY FK_board_comment_card');
        $this->addSql('ALTER TABLE board_attachment DROP FOREIGN KEY FK_board_attachment_uploaded_by');
        $this->addSql('ALTER TABLE board_attachment DROP FOREIGN KEY FK_board_attachment_card');
        $this->addSql('ALTER TABLE board_checklist_item DROP FOREIGN KEY FK_board_checklist_item_checklist');
        $this->addSql('ALTER TABLE board_checklist DROP FOREIGN KEY FK_board_checklist_card');
        $this->addSql('DROP TABLE board_activity_log');
        $this->addSql('DROP TABLE board_comment');
        $this->addSql('DROP TABLE board_attachment');
        $this->addSql('DROP TABLE board_checklist_item');
        $this->addSql('DROP TABLE board_checklist');
    }
}

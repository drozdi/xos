<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Board Phase 2: board_list, board_card, board_label, board_card_label, board_card_assignee.
 */
final class Version20260817140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create board_list, board_card, board_label, board_card_label, board_card_assignee tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE board_list (
            id INT AUTO_INCREMENT NOT NULL,
            board_id INT NOT NULL,
            assignee_id INT DEFAULT NULL,
            title VARCHAR(255) NOT NULL,
            order_index INT NOT NULL,
            archived_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_board_list_assignee (assignee_id),
            INDEX IDX_board_list_board_order (board_id, order_index),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_card (
            id INT AUTO_INCREMENT NOT NULL,
            list_id INT NOT NULL,
            created_by_id INT DEFAULT NULL,
            title VARCHAR(512) NOT NULL,
            description_md LONGTEXT DEFAULT NULL,
            due_date DATETIME DEFAULT NULL,
            position INT NOT NULL,
            cover_color VARCHAR(16) DEFAULT NULL,
            archived_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_board_card_due (due_date),
            INDEX IDX_board_card_list_pos (list_id, position),
            INDEX IDX_board_card_created_by (created_by_id),
            INDEX IDX_board_card_title (title(191)),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_label (
            id INT AUTO_INCREMENT NOT NULL,
            board_id INT NOT NULL,
            name VARCHAR(64) NOT NULL,
            color VARCHAR(16) NOT NULL,
            INDEX IDX_board_label_board (board_id),
            UNIQUE INDEX uniq_board_label_board_name (board_id, name),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_card_label (
            card_id INT NOT NULL,
            label_id INT NOT NULL,
            INDEX IDX_board_card_label_label (label_id),
            PRIMARY KEY(card_id, label_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_card_assignee (
            card_id INT NOT NULL,
            user_id INT NOT NULL,
            INDEX IDX_bca_user (user_id),
            PRIMARY KEY(card_id, user_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE board_list ADD CONSTRAINT FK_board_list_board FOREIGN KEY (board_id) REFERENCES board_board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_list ADD CONSTRAINT FK_board_list_assignee FOREIGN KEY (assignee_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE board_card ADD CONSTRAINT FK_board_card_list FOREIGN KEY (list_id) REFERENCES board_list (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_card ADD CONSTRAINT FK_board_card_created_by FOREIGN KEY (created_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE board_label ADD CONSTRAINT FK_board_label_board FOREIGN KEY (board_id) REFERENCES board_board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_card_label ADD CONSTRAINT FK_board_card_label_card FOREIGN KEY (card_id) REFERENCES board_card (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_card_label ADD CONSTRAINT FK_board_card_label_label FOREIGN KEY (label_id) REFERENCES board_label (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_card_assignee ADD CONSTRAINT FK_board_card_assignee_card FOREIGN KEY (card_id) REFERENCES board_card (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_card_assignee ADD CONSTRAINT FK_board_card_assignee_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE board_card_assignee DROP FOREIGN KEY FK_board_card_assignee_card');
        $this->addSql('ALTER TABLE board_card_assignee DROP FOREIGN KEY FK_board_card_assignee_user');
        $this->addSql('ALTER TABLE board_card_label DROP FOREIGN KEY FK_board_card_label_card');
        $this->addSql('ALTER TABLE board_card_label DROP FOREIGN KEY FK_board_card_label_label');
        $this->addSql('ALTER TABLE board_label DROP FOREIGN KEY FK_board_label_board');
        $this->addSql('ALTER TABLE board_card DROP FOREIGN KEY FK_board_card_list');
        $this->addSql('ALTER TABLE board_card DROP FOREIGN KEY FK_board_card_created_by');
        $this->addSql('ALTER TABLE board_list DROP FOREIGN KEY FK_board_list_board');
        $this->addSql('ALTER TABLE board_list DROP FOREIGN KEY FK_board_list_assignee');
        $this->addSql('DROP TABLE board_card_assignee');
        $this->addSql('DROP TABLE board_card_label');
        $this->addSql('DROP TABLE board_label');
        $this->addSql('DROP TABLE board_card');
        $this->addSql('DROP TABLE board_list');
    }
}

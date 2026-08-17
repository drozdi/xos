<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Board Phase 1: workspace, workspace_member, board, board_member tables.
 */
final class Version20260817130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create board_workspace, board_workspace_member, board_board, board_board_member tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE board_workspace (
            id INT AUTO_INCREMENT NOT NULL,
            owner_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_board_workspace_owner (owner_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_workspace_member (
            id INT AUTO_INCREMENT NOT NULL,
            workspace_id INT NOT NULL,
            user_id INT NOT NULL,
            invited_by_id INT DEFAULT NULL,
            role VARCHAR(16) NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX IDX_bwm_user (user_id),
            INDEX IDX_bwm_invited_by (invited_by_id),
            UNIQUE INDEX uniq_bwm_workspace_user (workspace_id, user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_board (
            id INT AUTO_INCREMENT NOT NULL,
            workspace_id INT NOT NULL,
            created_by_id INT DEFAULT NULL,
            title VARCHAR(255) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            background_type VARCHAR(16) NOT NULL,
            background_value VARCHAR(512) NOT NULL,
            visibility VARCHAR(16) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_board_board_ws (workspace_id),
            INDEX IDX_board_board_updated (updated_at),
            INDEX IDX_board_board_created_by (created_by_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE board_board_member (
            id INT AUTO_INCREMENT NOT NULL,
            board_id INT NOT NULL,
            user_id INT NOT NULL,
            role VARCHAR(16) NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX IDX_bbm_user (user_id),
            UNIQUE INDEX uniq_bbm_board_user (board_id, user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE board_workspace ADD CONSTRAINT FK_board_workspace_owner FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE board_workspace_member ADD CONSTRAINT FK_bwm_workspace FOREIGN KEY (workspace_id) REFERENCES board_workspace (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_workspace_member ADD CONSTRAINT FK_bwm_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_workspace_member ADD CONSTRAINT FK_bwm_invited_by FOREIGN KEY (invited_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE board_board ADD CONSTRAINT FK_board_board_workspace FOREIGN KEY (workspace_id) REFERENCES board_workspace (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_board ADD CONSTRAINT FK_board_board_created_by FOREIGN KEY (created_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE board_board_member ADD CONSTRAINT FK_bbm_board FOREIGN KEY (board_id) REFERENCES board_board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_board_member ADD CONSTRAINT FK_bbm_user FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE board_board_member DROP FOREIGN KEY FK_bbm_board');
        $this->addSql('ALTER TABLE board_board_member DROP FOREIGN KEY FK_bbm_user');
        $this->addSql('ALTER TABLE board_board DROP FOREIGN KEY FK_board_board_workspace');
        $this->addSql('ALTER TABLE board_board DROP FOREIGN KEY FK_board_board_created_by');
        $this->addSql('ALTER TABLE board_workspace_member DROP FOREIGN KEY FK_bwm_workspace');
        $this->addSql('ALTER TABLE board_workspace_member DROP FOREIGN KEY FK_bwm_user');
        $this->addSql('ALTER TABLE board_workspace_member DROP FOREIGN KEY FK_bwm_invited_by');
        $this->addSql('ALTER TABLE board_workspace DROP FOREIGN KEY FK_board_workspace_owner');
        $this->addSql('DROP TABLE board_board_member');
        $this->addSql('DROP TABLE board_board');
        $this->addSql('DROP TABLE board_workspace_member');
        $this->addSql('DROP TABLE board_workspace');
    }
}

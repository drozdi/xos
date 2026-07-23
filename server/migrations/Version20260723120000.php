<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260723120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Todo: lists, items with due dates, sharing by user';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE todo_list (
                id INT AUTO_INCREMENT NOT NULL,
                owner_id INT NOT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                color VARCHAR(32) DEFAULT '#fff59d' NOT NULL,
                notes_md LONGTEXT DEFAULT NULL,
                created_at DATETIME NOT NULL,
                INDEX IDX_TODO_LIST_OWNER (owner_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql(<<<'SQL'
            CREATE TABLE todo_item (
                id INT AUTO_INCREMENT NOT NULL,
                list_id INT NOT NULL,
                text LONGTEXT NOT NULL,
                done TINYINT(1) DEFAULT 0 NOT NULL,
                due_at DATETIME DEFAULT NULL,
                position INT DEFAULT 0 NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX IDX_TODO_ITEM_LIST (list_id),
                INDEX IDX_TODO_ITEM_DUE (due_at),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql(<<<'SQL'
            CREATE TABLE todo_list_share (
                id INT AUTO_INCREMENT NOT NULL,
                list_id INT NOT NULL,
                user_id INT NOT NULL,
                permission VARCHAR(16) DEFAULT 'read' NOT NULL,
                UNIQUE INDEX UNIQ_TODO_LIST_SHARE (list_id, user_id),
                INDEX IDX_TODO_LIST_SHARE_LIST (list_id),
                INDEX IDX_TODO_LIST_SHARE_USER (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql('ALTER TABLE todo_list ADD CONSTRAINT FK_TODO_LIST_OWNER FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE todo_item ADD CONSTRAINT FK_TODO_ITEM_LIST FOREIGN KEY (list_id) REFERENCES todo_list (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE todo_list_share ADD CONSTRAINT FK_TODO_LIST_SHARE_LIST FOREIGN KEY (list_id) REFERENCES todo_list (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE todo_list_share ADD CONSTRAINT FK_TODO_LIST_SHARE_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE todo_item DROP FOREIGN KEY FK_TODO_ITEM_LIST');
        $this->addSql('ALTER TABLE todo_list_share DROP FOREIGN KEY FK_TODO_LIST_SHARE_LIST');
        $this->addSql('ALTER TABLE todo_list_share DROP FOREIGN KEY FK_TODO_LIST_SHARE_USER');
        $this->addSql('ALTER TABLE todo_list DROP FOREIGN KEY FK_TODO_LIST_OWNER');
        $this->addSql('DROP TABLE todo_list_share');
        $this->addSql('DROP TABLE todo_item');
        $this->addSql('DROP TABLE todo_list');
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260723091158 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE todo_item (id INT AUTO_INCREMENT NOT NULL, list_id INT NOT NULL, text LONGTEXT NOT NULL, done TINYINT(1) DEFAULT 0 NOT NULL, due_at DATETIME DEFAULT NULL, position INT DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, INDEX IDX_40CA43013DAE168B (list_id), INDEX IDX_TODO_ITEM_DUE (due_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE todo_list (id INT AUTO_INCREMENT NOT NULL, owner_id INT NOT NULL, x_timestamp DATETIME DEFAULT NULL, title VARCHAR(255) NOT NULL, color VARCHAR(32) DEFAULT '#fff59d' NOT NULL, notes_md LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, INDEX IDX_1B199E077E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE todo_list_share (id INT AUTO_INCREMENT NOT NULL, list_id INT NOT NULL, user_id INT NOT NULL, permission VARCHAR(16) DEFAULT 'read' NOT NULL, INDEX IDX_2B6F8C8B3DAE168B (list_id), INDEX IDX_2B6F8C8BA76ED395 (user_id), UNIQUE INDEX UNIQ_TODO_LIST_SHARE (list_id, user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_item ADD CONSTRAINT FK_40CA43013DAE168B FOREIGN KEY (list_id) REFERENCES todo_list (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_list ADD CONSTRAINT FK_1B199E077E3C61F9 FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_list_share ADD CONSTRAINT FK_2B6F8C8B3DAE168B FOREIGN KEY (list_id) REFERENCES todo_list (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_list_share ADD CONSTRAINT FK_2B6F8C8BA76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_accounting CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_location CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_block CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_element CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_property CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_property_enum CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_section CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_type CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_account CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_category CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_product CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_tag CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_transaction CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_transaction_item CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_transfer CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_ou CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_item DROP FOREIGN KEY FK_40CA43013DAE168B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_list DROP FOREIGN KEY FK_1B199E077E3C61F9
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_list_share DROP FOREIGN KEY FK_2B6F8C8B3DAE168B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE todo_list_share DROP FOREIGN KEY FK_2B6F8C8BA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE todo_item
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE todo_list
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE todo_list_share
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_accounting CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_location CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_block CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_element CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_property CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_property_enum CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_section CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_type CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_account CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_category CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_product CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_tag CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_transaction CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_transaction_item CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE inccom_transfer CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_ou CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
    }
}

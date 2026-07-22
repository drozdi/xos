<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260722101315 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event DROP FOREIGN KEY FK_ST_EP_EVENT_CLASS
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event DROP FOREIGN KEY FK_ST_EP_EVENT_GROUP
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE st_ep_group_user (id INT AUTO_INCREMENT NOT NULL, group_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_7C39A80EFE54D947 (group_id), INDEX IDX_7C39A80EA76ED395 (user_id), UNIQUE INDEX UNIQ_7C39A80EFE54D947A76ED395 (group_id, user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_group_user ADD CONSTRAINT FK_7C39A80EFE54D947 FOREIGN KEY (group_id) REFERENCES st_ep_group (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_group_user ADD CONSTRAINT FK_7C39A80EA76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group DROP FOREIGN KEY FK_ST_GROUP_PARENT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group DROP FOREIGN KEY FK_ST_GROUP_SUBJECT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group DROP FOREIGN KEY FK_ST_GROUP_USER
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group_user DROP FOREIGN KEY FK_ST_GROUP_USER_GROUP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group_user DROP FOREIGN KEY FK_ST_GROUP_USER_USER
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE step_group_user DROP FOREIGN KEY FK_A8A2AB78A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE step_group_user DROP FOREIGN KEY FK_A8A2AB78FE54D947
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE st_group
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE st_group_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE step_group_user
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
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event ADD CONSTRAINT FK_2A391737FE54D947 FOREIGN KEY (group_id) REFERENCES st_ep_group (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event ADD CONSTRAINT FK_2A391737EA000B10 FOREIGN KEY (class_id) REFERENCES st_ep_group (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_group CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE st_group (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, user_id INT DEFAULT NULL, subject_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, sort INT DEFAULT 100 NOT NULL, level INT DEFAULT 0 NOT NULL, name VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, code VARCHAR(191) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, description LONGTEXT CHARACTER SET utf8mb4 DEFAULT NULL COLLATE `utf8mb4_unicode_ci`, graduated TINYINT(1) DEFAULT 0 NOT NULL, graduated_year SMALLINT DEFAULT NULL, UNIQUE INDEX UNIQ_ST_GROUP_CODE (code), INDEX IDX_ST_GROUP_PARENT (parent_id), INDEX IDX_ST_GROUP_USER (user_id), INDEX IDX_ST_GROUP_SUBJECT (subject_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE st_group_user (id INT AUTO_INCREMENT NOT NULL, group_id INT NOT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_ST_GROUP_USER_PAIR (group_id, user_id), INDEX IDX_ST_GROUP_USER_GROUP (group_id), INDEX IDX_ST_GROUP_USER_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE step_group_user (id INT AUTO_INCREMENT NOT NULL, group_id INT NOT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_A8A2AB78FE54D947A76ED395 (group_id, user_id), INDEX IDX_A8A2AB78FE54D947 (group_id), INDEX IDX_A8A2AB78A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group ADD CONSTRAINT FK_ST_GROUP_PARENT FOREIGN KEY (parent_id) REFERENCES st_group (id) ON UPDATE NO ACTION ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group ADD CONSTRAINT FK_ST_GROUP_SUBJECT FOREIGN KEY (subject_id) REFERENCES st_ep_subject (id) ON UPDATE NO ACTION ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group ADD CONSTRAINT FK_ST_GROUP_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON UPDATE NO ACTION ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group_user ADD CONSTRAINT FK_ST_GROUP_USER_GROUP FOREIGN KEY (group_id) REFERENCES st_group (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_group_user ADD CONSTRAINT FK_ST_GROUP_USER_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE step_group_user ADD CONSTRAINT FK_A8A2AB78A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE step_group_user ADD CONSTRAINT FK_A8A2AB78FE54D947 FOREIGN KEY (group_id) REFERENCES st_ep_group (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_group_user DROP FOREIGN KEY FK_7C39A80EFE54D947
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_group_user DROP FOREIGN KEY FK_7C39A80EA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE st_ep_group_user
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
            ALTER TABLE st_ep_event DROP FOREIGN KEY FK_2A391737FE54D947
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event DROP FOREIGN KEY FK_2A391737EA000B10
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event ADD CONSTRAINT FK_ST_EP_EVENT_CLASS FOREIGN KEY (class_id) REFERENCES st_group (id) ON UPDATE NO ACTION
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event ADD CONSTRAINT FK_ST_EP_EVENT_GROUP FOREIGN KEY (group_id) REFERENCES st_group (id) ON UPDATE NO ACTION
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_group CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
    }
}

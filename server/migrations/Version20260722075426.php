<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260722075426 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE st_ep_event_file (event_id INT NOT NULL, file_id INT NOT NULL, INDEX IDX_4BA45F8C71F7E88B (event_id), INDEX IDX_4BA45F8C93CB796C (file_id), PRIMARY KEY(event_id, file_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE st_ep_subject_user (subject_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_C45AFE1123EDC87 (subject_id), INDEX IDX_C45AFE11A76ED395 (user_id), PRIMARY KEY(subject_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event_file ADD CONSTRAINT FK_4BA45F8C71F7E88B FOREIGN KEY (event_id) REFERENCES st_ep_event (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event_file ADD CONSTRAINT FK_4BA45F8C93CB796C FOREIGN KEY (file_id) REFERENCES main_file (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_subject_user ADD CONSTRAINT FK_C45AFE1123EDC87 FOREIGN KEY (subject_id) REFERENCES st_ep_subject (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_subject_user ADD CONSTRAINT FK_C45AFE11A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_event_file DROP FOREIGN KEY FK_A37A951471F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_event_file DROP FOREIGN KEY FK_A37A951493CB796C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_subject_user DROP FOREIGN KEY FK_6733D7323EDC87
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_subject_user DROP FOREIGN KEY FK_6733D73A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE ep_event_file
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE ep_subject_user
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
            CREATE TABLE ep_event_file (event_id INT NOT NULL, file_id INT NOT NULL, INDEX IDX_A37A951493CB796C (file_id), INDEX IDX_A37A951471F7E88B (event_id), PRIMARY KEY(event_id, file_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE ep_subject_user (subject_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_6733D73A76ED395 (user_id), INDEX IDX_6733D7323EDC87 (subject_id), PRIMARY KEY(subject_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_event_file ADD CONSTRAINT FK_A37A951471F7E88B FOREIGN KEY (event_id) REFERENCES st_ep_event (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_event_file ADD CONSTRAINT FK_A37A951493CB796C FOREIGN KEY (file_id) REFERENCES main_file (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_subject_user ADD CONSTRAINT FK_6733D7323EDC87 FOREIGN KEY (subject_id) REFERENCES st_ep_subject (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ep_subject_user ADD CONSTRAINT FK_6733D73A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event_file DROP FOREIGN KEY FK_4BA45F8C71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event_file DROP FOREIGN KEY FK_4BA45F8C93CB796C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_subject_user DROP FOREIGN KEY FK_C45AFE1123EDC87
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_subject_user DROP FOREIGN KEY FK_C45AFE11A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE st_ep_event_file
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE st_ep_subject_user
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

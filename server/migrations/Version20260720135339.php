<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260720135339 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
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
            ALTER TABLE d_type DROP INDEX UNIQ_357E3CC0549213EC, ADD INDEX IDX_357E3CC0549213EC (property_id)
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
            ALTER TABLE d_type DROP INDEX IDX_357E3CC0549213EC, ADD UNIQUE INDEX UNIQ_357E3CC0549213EC (property_id)
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

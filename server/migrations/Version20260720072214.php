<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260720072214 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Sync schema: remove orphan device properties and add missing FKs/indexes';
    }

    public function up(Schema $schema): void
    {
        $this->cleanupOrphanReferentialData();

        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_accounting CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_device CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_device_history CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_device_location CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        if (!$this->constraintExists('d_device_property', 'FK_5DA4683B549213EC')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_property ADD CONSTRAINT FK_5DA4683B549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE RESTRICT
            SQL);
        }
        if (!$this->indexExists('d_device_property', 'IDX_5DA4683B549213EC')) {
            $this->safeAddSql(<<<'SQL'
                CREATE INDEX IDX_5DA4683B549213EC ON d_device_property (property_id)
            SQL);
        }
        if ($this->indexExists('d_device_property', 'fk_5da4683b94a4c7d4')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_property RENAME INDEX fk_5da4683b94a4c7d4 TO IDX_5DA4683B94A4C7D4
            SQL);
        }
        if ($this->indexExists('d_device_property', 'fk_5da4683b86a9816a')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_property RENAME INDEX fk_5da4683b86a9816a TO IDX_5DA4683B86A9816A
            SQL);
        }
        if (!$this->primaryKeyExists('d_device_property_enum')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_property_enum ADD PRIMARY KEY (device_property_id, enum_id)
            SQL);
        }
        if (!$this->constraintExists('d_device_property_enum', 'FK_AA9C5E942612472A2612472A')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_property_enum ADD CONSTRAINT FK_AA9C5E942612472A2612472A FOREIGN KEY (device_property_id) REFERENCES d_device_property (id) ON DELETE CASCADE
            SQL);
        }
        if (!$this->constraintExists('d_device_property_enum', 'FK_AA9C5E9417628E55')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_property_enum ADD CONSTRAINT FK_AA9C5E9417628E55 FOREIGN KEY (enum_id) REFERENCES d_property_enum (id) ON DELETE CASCADE
            SQL);
        }
        if (!$this->indexExists('d_device_property_enum', 'IDX_AA9C5E942612472A')) {
            $this->safeAddSql(<<<'SQL'
                CREATE INDEX IDX_AA9C5E942612472A ON d_device_property_enum (device_property_id)
            SQL);
        }
        if (!$this->indexExists('d_device_property_enum', 'IDX_AA9C5E9417628E55')) {
            $this->safeAddSql(<<<'SQL'
                CREATE INDEX IDX_AA9C5E9417628E55 ON d_device_property_enum (enum_id)
            SQL);
        }
        if (!$this->primaryKeyExists('d_device_repair')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_repair CHANGE id id INT AUTO_INCREMENT NOT NULL, ADD PRIMARY KEY (id)
            SQL);
        }
        if (!$this->constraintExists('d_device_repair', 'FK_3C8E5FB494A4C7D4')) {
            $this->safeAddSql(<<<'SQL'
                ALTER TABLE d_device_repair ADD CONSTRAINT FK_3C8E5FB494A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
            SQL);
        }
        if (!$this->indexExists('d_device_repair', 'IDX_3C8E5FB494A4C7D4')) {
            $this->safeAddSql(<<<'SQL'
                CREATE INDEX IDX_3C8E5FB494A4C7D4 ON d_device_repair (device_id)
            SQL);
        }
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_A1840E0B77153098 ON d_license (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_license_key ADD CONSTRAINT FK_E45AD669F5503E07 FOREIGN KEY (license_software_id) REFERENCES d_license_software (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_license_key ADD CONSTRAINT FK_E45AD669D7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_E45AD669F5503E07 ON d_license_key (license_software_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_E45AD669D7452741 ON d_license_key (software_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_E45AD669F5503E07D745274188874D48 ON d_license_key (license_software_id, software_id, type_key)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_license_software ADD CONSTRAINT FK_60D6ADEA460F904B FOREIGN KEY (license_id) REFERENCES d_license (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_license_software ADD CONSTRAINT FK_60D6ADEAD7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE RESTRICT
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_60D6ADEA460F904B ON d_license_software (license_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_60D6ADEAD7452741 ON d_license_software (software_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_60D6ADEA460F904BD7452741 ON d_license_software (license_id, software_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_property CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816C727ACA70 FOREIGN KEY (parent_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816CC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE SET NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816C25998077 FOREIGN KEY (prototype_id) REFERENCES d_property (id) ON DELETE SET NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_78BD816C727ACA70 ON d_property (parent_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_78BD816CC54C8C93 ON d_property (type_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_78BD816C25998077 ON d_property (prototype_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_78BD816C727ACA7077153098 ON d_property (parent_id, code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_property_enum CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_property_enum ADD CONSTRAINT FK_70DC0BE5549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_70DC0BE5549213EC ON d_property_enum (property_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_70DC0BE5549213EC1D775834 ON d_property_enum (property_id, value)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57D727ACA70 FOREIGN KEY (parent_id) REFERENCES d_software (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57DC54C8C93 FOREIGN KEY (type_id) REFERENCES d_software_type (id) ON DELETE RESTRICT
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_849FF57D5E237E06 ON d_software (name)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_849FF57D727ACA70 ON d_software (parent_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_849FF57DC54C8C93 ON d_software (type_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_C8A1475B77153098 ON d_software_type (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_type ADD CONSTRAINT FK_357E3CC0727ACA70 FOREIGN KEY (parent_id) REFERENCES d_type (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_type ADD CONSTRAINT FK_357E3CC0549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_357E3CC0727ACA70 ON d_type (parent_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_357E3CC0549213EC ON d_type (property_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_357E3CC0727ACA7077153098 ON d_type (parent_id, code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_type_property ADD PRIMARY KEY (type_id, property_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_type_property ADD CONSTRAINT FK_277721ACC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE d_type_property ADD CONSTRAINT FK_277721AC549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_277721ACC54C8C93 ON d_type_property (type_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX IDX_277721AC549213EC ON d_type_property (property_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE iblock_block CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_E1A370DE77153098 ON iblock_block (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE iblock_element CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_C727E5EB77153098 ON iblock_element (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE iblock_property CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_E3A9C89D77153098 ON iblock_property (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE iblock_property_enum CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE iblock_section CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_AB14C13D77153098 ON iblock_section (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE iblock_type CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_E924747577153098 ON iblock_type (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_account CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_category CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_product CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_tag CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_transaction CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_transaction_item CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE inccom_transfer CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_D5B7FBD377153098 ON main_claimant (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE main_file CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_6C2C04729F75D7B0 ON main_file (external_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE main_group CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_CE9CF78377153098 ON main_group (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE main_ou CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_5E9420FE77153098 ON main_ou (code)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_B7DAB808771530989F409843 ON main_role (code, claimant_id)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE main_user CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_6D20E42BAA08CB10 ON main_user (login)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_6D20E42B9E1EB3D4 ON main_user (stored_hash)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_6D20E42BDB50E026 ON main_user (checkword)
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_9BACE7E1C74F2195 ON refresh_tokens (refresh_token)
        SQL);
        $this->safeAddSql(<<<'SQL'
            ALTER TABLE st_ep_event CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->safeAddSql(<<<'SQL'
            CREATE INDEX idx_user_category ON user_settings (user_id, category)
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
            ALTER TABLE d_device_property DROP FOREIGN KEY FK_5DA4683B549213EC
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_5DA4683B549213EC ON d_device_property
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property RENAME INDEX idx_5da4683b94a4c7d4 TO FK_5DA4683B94A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property RENAME INDEX idx_5da4683b86a9816a TO FK_5DA4683B86A9816A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum DROP FOREIGN KEY FK_AA9C5E942612472A2612472A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum DROP FOREIGN KEY FK_AA9C5E9417628E55
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_AA9C5E942612472A ON d_device_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_AA9C5E9417628E55 ON d_device_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX `primary` ON d_device_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair MODIFY id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair DROP FOREIGN KEY FK_3C8E5FB494A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_3C8E5FB494A4C7D4 ON d_device_repair
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX `primary` ON d_device_repair
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair CHANGE id id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_A1840E0B77153098 ON d_license
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key DROP FOREIGN KEY FK_E45AD669F5503E07
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key DROP FOREIGN KEY FK_E45AD669D7452741
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_E45AD669F5503E07 ON d_license_key
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_E45AD669D7452741 ON d_license_key
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_E45AD669F5503E07D745274188874D48 ON d_license_key
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software DROP FOREIGN KEY FK_60D6ADEA460F904B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software DROP FOREIGN KEY FK_60D6ADEAD7452741
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_60D6ADEA460F904B ON d_license_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_60D6ADEAD7452741 ON d_license_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_60D6ADEA460F904BD7452741 ON d_license_software
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property DROP FOREIGN KEY FK_78BD816C727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property DROP FOREIGN KEY FK_78BD816CC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property DROP FOREIGN KEY FK_78BD816C25998077
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_78BD816C727ACA70 ON d_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_78BD816CC54C8C93 ON d_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_78BD816C25998077 ON d_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_78BD816C727ACA7077153098 ON d_property
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum DROP FOREIGN KEY FK_70DC0BE5549213EC
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_70DC0BE5549213EC ON d_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_70DC0BE5549213EC1D775834 ON d_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57D727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57DC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_849FF57D5E237E06 ON d_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_849FF57D727ACA70 ON d_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_849FF57DC54C8C93 ON d_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_C8A1475B77153098 ON d_software_type
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type DROP FOREIGN KEY FK_357E3CC0727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type DROP FOREIGN KEY FK_357E3CC0549213EC
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_357E3CC0727ACA70 ON d_type
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_357E3CC0549213EC ON d_type
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_357E3CC0727ACA7077153098 ON d_type
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property DROP FOREIGN KEY FK_277721ACC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property DROP FOREIGN KEY FK_277721AC549213EC
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_277721ACC54C8C93 ON d_type_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_277721AC549213EC ON d_type_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX `primary` ON d_type_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_E1A370DE77153098 ON iblock_block
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_block CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_C727E5EB77153098 ON iblock_element
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_element CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_E3A9C89D77153098 ON iblock_property
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_property CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_property_enum CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_AB14C13D77153098 ON iblock_section
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE iblock_section CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_E924747577153098 ON iblock_type
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
            DROP INDEX UNIQ_D5B7FBD377153098 ON main_claimant
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_6C2C04729F75D7B0 ON main_file
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_CE9CF78377153098 ON main_group
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_5E9420FE77153098 ON main_ou
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_ou CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_B7DAB808771530989F409843 ON main_role
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_6D20E42BAA08CB10 ON main_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_6D20E42B9E1EB3D4 ON main_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_6D20E42BDB50E026 ON main_user
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_9BACE7E1C74F2195 ON refresh_tokens
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE st_ep_event CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_user_category ON user_settings
        SQL);
    }

    private function safeAddSql(string $sql): void
    {
        try {
            $this->connection->executeStatement($sql);
        } catch (\Doctrine\DBAL\Exception $e) {
            $message = $e->getMessage();
            if (
                str_contains($message, 'Duplicate foreign key')
                || str_contains($message, 'Duplicate key name')
                || str_contains($message, 'Multiple primary key defined')
                || str_contains($message, 'check that column/key exists')
            ) {
                return;
            }

            throw $e;
        }
    }

    private function cleanupOrphanReferentialData(): void
    {
        $this->connection->executeStatement(<<<'SQL'
            DELETE dpe FROM d_device_property_enum dpe
            INNER JOIN d_device_property dp ON dp.id = dpe.device_property_id
            LEFT JOIN d_property p ON p.id = dp.property_id
            WHERE p.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE dp FROM d_device_property dp
            LEFT JOIN d_property p ON p.id = dp.property_id
            WHERE p.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE dpe FROM d_device_property_enum dpe
            LEFT JOIN d_device_property dp ON dp.id = dpe.device_property_id
            WHERE dp.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE dpe FROM d_device_property_enum dpe
            LEFT JOIN d_property_enum pe ON pe.id = dpe.enum_id
            WHERE pe.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE lk FROM d_license_key lk
            LEFT JOIN d_license_software ls ON ls.id = lk.license_software_id
            WHERE ls.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE lk FROM d_license_key lk
            LEFT JOIN d_software s ON s.id = lk.software_id
            WHERE s.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE ls FROM d_license_software ls
            LEFT JOIN d_license l ON l.id = ls.license_id
            WHERE l.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE ls FROM d_license_software ls
            LEFT JOIN d_software s ON s.id = ls.software_id
            WHERE s.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE pe FROM d_property_enum pe
            LEFT JOIN d_property p ON p.id = pe.property_id
            WHERE p.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE tp FROM d_type_property tp
            LEFT JOIN d_type t ON t.id = tp.type_id
            WHERE t.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE tp FROM d_type_property tp
            LEFT JOIN d_property p ON p.id = tp.property_id
            WHERE p.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            DELETE s FROM d_software s
            LEFT JOIN d_software_type st ON st.id = s.type_id
            WHERE st.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            UPDATE d_property p
            LEFT JOIN d_property parent ON parent.id = p.parent_id
            SET p.parent_id = NULL
            WHERE p.parent_id IS NOT NULL AND parent.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            UPDATE d_property p
            LEFT JOIN d_property prototype ON prototype.id = p.prototype_id
            SET p.prototype_id = NULL
            WHERE p.prototype_id IS NOT NULL AND prototype.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            UPDATE d_property p
            LEFT JOIN d_type t ON t.id = p.type_id
            SET p.type_id = NULL
            WHERE p.type_id IS NOT NULL AND t.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            UPDATE d_software s
            LEFT JOIN d_software parent ON parent.id = s.parent_id
            SET s.parent_id = NULL
            WHERE s.parent_id IS NOT NULL AND parent.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            UPDATE d_type t
            LEFT JOIN d_type parent ON parent.id = t.parent_id
            SET t.parent_id = NULL
            WHERE t.parent_id IS NOT NULL AND parent.id IS NULL
        SQL);
        $this->connection->executeStatement(<<<'SQL'
            UPDATE d_type t
            LEFT JOIN d_property p ON p.id = t.property_id
            SET t.property_id = NULL
            WHERE t.property_id IS NOT NULL AND p.id IS NULL
        SQL);
    }

    private function constraintExists(string $table, string $name): bool
    {
        return (bool) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
            [$table, $name]
        );
    }

    private function indexExists(string $table, string $name): bool
    {
        return (bool) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
            [$table, $name]
        );
    }

    private function primaryKeyExists(string $table): bool
    {
        return (bool) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'PRIMARY KEY'",
            [$table]
        );
    }
}

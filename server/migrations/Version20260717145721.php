<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260717145721 extends AbstractMigration
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
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5BFE54D947 FOREIGN KEY (group_id) REFERENCES d_type (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5BC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5B3B7DD068 FOREIGN KEY (accounting_id) REFERENCES d_accounting (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5B93CB796C FOREIGN KEY (file_id) REFERENCES main_file (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5BDE12AB56 FOREIGN KEY (created_by) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5B25F94802 FOREIGN KEY (modified_by) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_5CF3FF5B3B7DD068 ON d_device (accounting_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_5CF3FF5B93CB796C ON d_device (file_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_5CF3FF5BFE54D94777153098 ON d_device (group_id, code)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_5CF3FF5BC54C8C93EFC17495 ON d_device (type_id, sn)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image CHANGE device_id device_id VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image ADD CONSTRAINT FK_125DB9E694A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image ADD CONSTRAINT FK_125DB9E693CB796C FOREIGN KEY (file_id) REFERENCES main_file (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history CHANGE id id VARCHAR(255) NOT NULL, CHANGE device_id device_id VARCHAR(255) NOT NULL, CHANGE parent_id parent_id VARCHAR(255) NOT NULL, CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history ADD CONSTRAINT FK_A76D7DEB94A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history ADD CONSTRAINT FK_A76D7DEB727ACA70 FOREIGN KEY (parent_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license CHANGE id id VARCHAR(255) NOT NULL, CHANGE device_id device_id VARCHAR(255) NOT NULL, CHANGE license_software_id license_software_id VARCHAR(255) NOT NULL, CHANGE software_id software_id VARCHAR(255) NOT NULL, CHANGE key_id key_id VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license ADD CONSTRAINT FK_D7BFF9B994A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license ADD CONSTRAINT FK_D7BFF9B9F5503E07 FOREIGN KEY (license_software_id) REFERENCES d_license_software (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license ADD CONSTRAINT FK_D7BFF9B9D7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license ADD CONSTRAINT FK_D7BFF9B9D145533 FOREIGN KEY (key_id) REFERENCES d_license_key (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_location CHANGE id id VARCHAR(255) NOT NULL, CHANGE device_id device_id VARCHAR(255) NOT NULL, CHANGE date date DATE NOT NULL, CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_location ADD CONSTRAINT FK_88C8FD2E94A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property CHANGE id id VARCHAR(255) NOT NULL, CHANGE device_id device_id VARCHAR(255) NOT NULL, CHANGE sub_device_id sub_device_id VARCHAR(255) DEFAULT NULL, CHANGE property_id property_id VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property ADD CONSTRAINT FK_5DA4683B94A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property ADD CONSTRAINT FK_5DA4683B86A9816A FOREIGN KEY (sub_device_id) REFERENCES d_device (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property ADD CONSTRAINT FK_5DA4683B549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum CHANGE device_property_id device_property_id VARCHAR(255) NOT NULL, CHANGE enum_id enum_id VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum ADD CONSTRAINT FK_AA9C5E942612472A2612472A FOREIGN KEY (device_property_id) REFERENCES d_device_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum ADD CONSTRAINT FK_AA9C5E9417628E55 FOREIGN KEY (enum_id) REFERENCES d_property_enum (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair CHANGE id id VARCHAR(255) NOT NULL, CHANGE device_id device_id VARCHAR(255) NOT NULL, CHANGE put_into put_into DATE NOT NULL, CHANGE received_from received_from DATE DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair ADD CONSTRAINT FK_3C8E5FB494A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license CHANGE id id VARCHAR(255) NOT NULL, CHANGE code code VARCHAR(255) NOT NULL, CHANGE sort sort INT DEFAULT 100
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key CHANGE id id VARCHAR(255) NOT NULL, CHANGE license_software_id license_software_id VARCHAR(255) NOT NULL, CHANGE software_id software_id VARCHAR(255) NOT NULL, CHANGE value value VARCHAR(255) DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key ADD CONSTRAINT FK_E45AD669F5503E07 FOREIGN KEY (license_software_id) REFERENCES d_license_software (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key ADD CONSTRAINT FK_E45AD669D7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_E45AD669F5503E07D745274188874D48 ON d_license_key (license_software_id, software_id, type_key)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software CHANGE id id VARCHAR(255) NOT NULL, CHANGE license_id license_id VARCHAR(255) NOT NULL, CHANGE software_id software_id VARCHAR(255) NOT NULL, CHANGE count count INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software ADD CONSTRAINT FK_60D6ADEA460F904B FOREIGN KEY (license_id) REFERENCES d_license (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software ADD CONSTRAINT FK_60D6ADEAD7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_60D6ADEA460F904BD7452741 ON d_license_software (license_id, software_id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property CHANGE id id VARCHAR(255) NOT NULL, CHANGE parent_id parent_id VARCHAR(255) DEFAULT NULL, CHANGE type_id type_id VARCHAR(255) DEFAULT NULL, CHANGE code code VARCHAR(255) NOT NULL, CHANGE sort sort INT DEFAULT 100, CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CHANGE date_created date_created DATETIME NOT NULL, CHANGE prototype_id prototype_id VARCHAR(255) DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816C727ACA70 FOREIGN KEY (parent_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816CC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816C25998077 FOREIGN KEY (prototype_id) REFERENCES d_property (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_78BD816C727ACA70 ON d_property (parent_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_78BD816CC54C8C93 ON d_property (type_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_78BD816C25998077 ON d_property (prototype_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_78BD816C727ACA7077153098 ON d_property (parent_id, code)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum CHANGE id id VARCHAR(255) NOT NULL, CHANGE property_id property_id VARCHAR(255) DEFAULT NULL, CHANGE x_timestamp x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CHANGE value value VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum ADD CONSTRAINT FK_70DC0BE5549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_70DC0BE5549213EC1D775834 ON d_property_enum (property_id, value)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57D727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software CHANGE id id VARCHAR(255) NOT NULL, CHANGE parent_id parent_id VARCHAR(255) DEFAULT NULL, CHANGE type_id type_id VARCHAR(255) NOT NULL, CHANGE sort sort INT DEFAULT 100
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57DC54C8C93 FOREIGN KEY (type_id) REFERENCES d_software_type (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57D727ACA70 FOREIGN KEY (parent_id) REFERENCES d_software (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_849FF57D5E237E06 ON d_software (name)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software_type CHANGE id id VARCHAR(255) NOT NULL, CHANGE code code VARCHAR(255) NOT NULL, CHANGE sort sort INT DEFAULT 100
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_C8A1475B77153098 ON d_software_type (code)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type CHANGE id id VARCHAR(255) NOT NULL, CHANGE property_id property_id VARCHAR(255) DEFAULT NULL, CHANGE code code VARCHAR(255) NOT NULL, CHANGE parent_id parent_id VARCHAR(255) DEFAULT NULL, CHANGE sort sort INT DEFAULT 100
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type ADD CONSTRAINT FK_357E3CC0727ACA70 FOREIGN KEY (parent_id) REFERENCES d_type (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type ADD CONSTRAINT FK_357E3CC0549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_357E3CC0727ACA70 ON d_type (parent_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_357E3CC0549213EC ON d_type (property_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_357E3CC0727ACA7077153098 ON d_type (parent_id, code)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property CHANGE type_id type_id VARCHAR(255) NOT NULL, CHANGE property_id property_id VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property ADD CONSTRAINT FK_277721ACC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property ADD CONSTRAINT FK_277721AC549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
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
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE d_accounting CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5BFE54D947
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5BC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5B3B7DD068
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5B93CB796C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5BDE12AB56
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5B25F94802
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_5CF3FF5B3B7DD068 ON d_device
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_5CF3FF5B93CB796C ON d_device
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_5CF3FF5BFE54D94777153098 ON d_device
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_5CF3FF5BC54C8C93EFC17495 ON d_device
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history DROP FOREIGN KEY FK_A76D7DEB94A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history DROP FOREIGN KEY FK_A76D7DEB727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE device_id device_id INT NOT NULL, CHANGE parent_id parent_id INT NOT NULL, CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image DROP FOREIGN KEY FK_125DB9E694A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image DROP FOREIGN KEY FK_125DB9E693CB796C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image CHANGE device_id device_id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license DROP FOREIGN KEY FK_D7BFF9B994A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license DROP FOREIGN KEY FK_D7BFF9B9F5503E07
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license DROP FOREIGN KEY FK_D7BFF9B9D7452741
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license DROP FOREIGN KEY FK_D7BFF9B9D145533
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_license CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE device_id device_id INT NOT NULL, CHANGE license_software_id license_software_id INT NOT NULL, CHANGE software_id software_id INT NOT NULL, CHANGE key_id key_id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_location DROP FOREIGN KEY FK_88C8FD2E94A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_location CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE device_id device_id INT NOT NULL, CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, CHANGE date date DATETIME NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property DROP FOREIGN KEY FK_5DA4683B94A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property DROP FOREIGN KEY FK_5DA4683B86A9816A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property DROP FOREIGN KEY FK_5DA4683B549213EC
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE device_id device_id INT NOT NULL, CHANGE sub_device_id sub_device_id INT DEFAULT NULL, CHANGE property_id property_id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum DROP FOREIGN KEY FK_AA9C5E942612472A2612472A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum DROP FOREIGN KEY FK_AA9C5E9417628E55
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum CHANGE device_property_id device_property_id INT NOT NULL, CHANGE enum_id enum_id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair DROP FOREIGN KEY FK_3C8E5FB494A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE device_id device_id INT NOT NULL, CHANGE put_into put_into DATETIME NOT NULL, CHANGE received_from received_from DATETIME DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE code code VARCHAR(191) NOT NULL, CHANGE sort sort INT DEFAULT 100 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key DROP FOREIGN KEY FK_E45AD669F5503E07
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key DROP FOREIGN KEY FK_E45AD669D7452741
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_E45AD669F5503E07D745274188874D48 ON d_license_key
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE license_software_id license_software_id INT DEFAULT NULL, CHANGE software_id software_id INT DEFAULT NULL, CHANGE value value VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software DROP FOREIGN KEY FK_60D6ADEA460F904B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software DROP FOREIGN KEY FK_60D6ADEAD7452741
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_60D6ADEA460F904BD7452741 ON d_license_software
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE license_id license_id INT DEFAULT NULL, CHANGE software_id software_id INT DEFAULT NULL, CHANGE count count INT NOT NULL
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
            ALTER TABLE d_property CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE parent_id parent_id INT DEFAULT NULL, CHANGE type_id type_id INT DEFAULT NULL, CHANGE prototype_id prototype_id INT DEFAULT NULL, CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, CHANGE date_created date_created VARCHAR(255) DEFAULT NULL, CHANGE code code VARCHAR(191) NOT NULL, CHANGE sort sort INT DEFAULT 100 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum DROP FOREIGN KEY FK_70DC0BE5549213EC
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_70DC0BE5549213EC1D775834 ON d_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE property_id property_id INT DEFAULT NULL, CHANGE x_timestamp x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, CHANGE value value VARCHAR(191) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57DC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57D727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_849FF57D5E237E06 ON d_software
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE parent_id parent_id INT DEFAULT NULL, CHANGE type_id type_id INT NOT NULL, CHANGE sort sort INT DEFAULT 100 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57D727ACA70 FOREIGN KEY (parent_id) REFERENCES d_software (id) ON UPDATE NO ACTION ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_C8A1475B77153098 ON d_software_type
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software_type CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE code code VARCHAR(191) NOT NULL, CHANGE sort sort INT DEFAULT 100 NOT NULL
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
            ALTER TABLE d_type CHANGE id id INT AUTO_INCREMENT NOT NULL, CHANGE parent_id parent_id INT DEFAULT NULL, CHANGE property_id property_id INT DEFAULT NULL, CHANGE code code VARCHAR(191) NOT NULL, CHANGE sort sort INT DEFAULT 100 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property DROP FOREIGN KEY FK_277721ACC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property DROP FOREIGN KEY FK_277721AC549213EC
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property CHANGE type_id type_id INT NOT NULL, CHANGE property_id property_id INT NOT NULL
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
    }
}

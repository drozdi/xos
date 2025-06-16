<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250616104423 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE d_accounting (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, date_created DATETIME NOT NULL, name LONGTEXT DEFAULT NULL, in_no VARCHAR(255) DEFAULT NULL, invoice VARCHAR(255) DEFAULT NULL, date_invoice DATETIME DEFAULT NULL, date_discarded DATETIME DEFAULT NULL, discarded TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_3588D169727ACA70 (parent_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, type_id INT DEFAULT NULL, group_id INT DEFAULT NULL, accounting_id INT DEFAULT NULL, created_by INT DEFAULT NULL, modified_by INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, date_created DATETIME DEFAULT NULL, code VARCHAR(191) NOT NULL, name VARCHAR(255) DEFAULT NULL, sn VARCHAR(191) DEFAULT NULL, sort INT DEFAULT 100 NOT NULL, description LONGTEXT DEFAULT NULL, log LONGTEXT DEFAULT NULL, INDEX IDX_5CF3FF5B727ACA70 (parent_id), INDEX IDX_5CF3FF5BC54C8C93 (type_id), INDEX IDX_5CF3FF5BFE54D947 (group_id), UNIQUE INDEX UNIQ_5CF3FF5B3B7DD068 (accounting_id), INDEX IDX_5CF3FF5BDE12AB56 (created_by), INDEX IDX_5CF3FF5B25F94802 (modified_by), UNIQUE INDEX UNIQ_5CF3FF5BFE54D94777153098 (group_id, code), UNIQUE INDEX UNIQ_5CF3FF5BC54C8C93EFC17495 (type_id, sn), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_image (device_id INT NOT NULL, file_id INT NOT NULL, INDEX IDX_125DB9E694A4C7D4 (device_id), INDEX IDX_125DB9E693CB796C (file_id), PRIMARY KEY(device_id, file_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_history (id INT AUTO_INCREMENT NOT NULL, device_id INT NOT NULL, parent_id INT NOT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, date_placement DATETIME NOT NULL, execute DATETIME DEFAULT NULL, INDEX IDX_A76D7DEB94A4C7D4 (device_id), INDEX IDX_A76D7DEB727ACA70 (parent_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_license (id INT AUTO_INCREMENT NOT NULL, device_id INT NOT NULL, license_software_id INT NOT NULL, software_id INT NOT NULL, key_id INT NOT NULL, INDEX IDX_D7BFF9B994A4C7D4 (device_id), INDEX IDX_D7BFF9B9F5503E07 (license_software_id), INDEX IDX_D7BFF9B9D7452741 (software_id), INDEX IDX_D7BFF9B9D145533 (key_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_location (id INT AUTO_INCREMENT NOT NULL, device_id INT NOT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, date DATETIME NOT NULL, place VARCHAR(255) NOT NULL, responsible VARCHAR(255) NOT NULL, INDEX IDX_88C8FD2E94A4C7D4 (device_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_property (id INT AUTO_INCREMENT NOT NULL, device_id INT NOT NULL, sub_device_id INT DEFAULT NULL, property_id INT NOT NULL, value VARCHAR(255) DEFAULT NULL, value_s VARCHAR(255) DEFAULT NULL, value_n DOUBLE PRECISION DEFAULT NULL, INDEX IDX_5DA4683B94A4C7D4 (device_id), INDEX IDX_5DA4683B86A9816A (sub_device_id), INDEX IDX_5DA4683B549213EC (property_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_property_enum (device_property_id INT NOT NULL, enum_id INT NOT NULL, INDEX IDX_AA9C5E942612472A (device_property_id), INDEX IDX_AA9C5E9417628E55 (enum_id), PRIMARY KEY(device_property_id, enum_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_device_repair (id INT AUTO_INCREMENT NOT NULL, device_id INT NOT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, put_into DATETIME NOT NULL, received_from DATETIME DEFAULT NULL, closed TINYINT(1) DEFAULT 0 NOT NULL, reason LONGTEXT NOT NULL, repairman VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, INDEX IDX_3C8E5FB494A4C7D4 (device_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_license (id INT AUTO_INCREMENT NOT NULL, code VARCHAR(191) NOT NULL, type VARCHAR(255) NOT NULL, aut_no VARCHAR(255) NOT NULL, no VARCHAR(255) NOT NULL, date_real DATETIME DEFAULT NULL, sort INT DEFAULT 100 NOT NULL, UNIQUE INDEX UNIQ_A1840E0B77153098 (code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_license_key (id INT AUTO_INCREMENT NOT NULL, license_software_id INT DEFAULT NULL, software_id INT DEFAULT NULL, type_key VARCHAR(191) DEFAULT 'VLK' NOT NULL, value VARCHAR(255) NOT NULL, actived VARCHAR(255) NOT NULL, INDEX IDX_E45AD669F5503E07 (license_software_id), INDEX IDX_E45AD669D7452741 (software_id), UNIQUE INDEX UNIQ_E45AD669F5503E07D745274188874D48 (license_software_id, software_id, type_key), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_license_software (id INT AUTO_INCREMENT NOT NULL, license_id INT DEFAULT NULL, software_id INT DEFAULT NULL, count INT NOT NULL, INDEX IDX_60D6ADEA460F904B (license_id), INDEX IDX_60D6ADEAD7452741 (software_id), UNIQUE INDEX UNIQ_60D6ADEA460F904BD7452741 (license_id, software_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_property (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, type_id INT DEFAULT NULL, prototype_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, active TINYINT(1) DEFAULT 1 NOT NULL, active_from DATETIME DEFAULT NULL, active_to DATETIME DEFAULT NULL, sort INT DEFAULT 100 NOT NULL, code VARCHAR(191) NOT NULL, name VARCHAR(255) NOT NULL, required TINYINT(1) DEFAULT 0 NOT NULL, multiple TINYINT(1) DEFAULT 0 NOT NULL, field_type VARCHAR(255) DEFAULT 'S' NOT NULL, list_type VARCHAR(255) DEFAULT 'S' NOT NULL, default_value VARCHAR(255) DEFAULT NULL, postfix VARCHAR(255) DEFAULT NULL, prefix VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, INDEX IDX_78BD816C727ACA70 (parent_id), UNIQUE INDEX UNIQ_78BD816CC54C8C93 (type_id), INDEX IDX_78BD816C25998077 (prototype_id), UNIQUE INDEX UNIQ_78BD816C727ACA7077153098 (parent_id, code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_property_enum (id INT AUTO_INCREMENT NOT NULL, property_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, name VARCHAR(255) DEFAULT NULL, code VARCHAR(191) NOT NULL, `default` TINYINT(1) DEFAULT 0 NOT NULL, sort INT DEFAULT 100 NOT NULL, INDEX IDX_70DC0BE5549213EC (property_id), UNIQUE INDEX UNIQ_70DC0BE5549213EC77153098 (property_id, code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_software (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, type_id INT NOT NULL, name VARCHAR(255) NOT NULL, sort INT DEFAULT 100 NOT NULL, INDEX IDX_849FF57D727ACA70 (parent_id), INDEX IDX_849FF57DC54C8C93 (type_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_software_type (id INT AUTO_INCREMENT NOT NULL, code VARCHAR(191) NOT NULL, name VARCHAR(255) NOT NULL, sort INT DEFAULT 100 NOT NULL, UNIQUE INDEX UNIQ_C8A1475B77153098 (code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_type (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, property_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, active TINYINT(1) DEFAULT 1 NOT NULL, active_from DATETIME DEFAULT NULL, active_to DATETIME DEFAULT NULL, sort INT DEFAULT 100 NOT NULL, code VARCHAR(191) NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, INDEX IDX_357E3CC0727ACA70 (parent_id), UNIQUE INDEX UNIQ_357E3CC0549213EC (property_id), UNIQUE INDEX UNIQ_357E3CC0727ACA7077153098 (parent_id, code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE d_type_property (type_id INT NOT NULL, property_id INT NOT NULL, INDEX IDX_277721ACC54C8C93 (type_id), INDEX IDX_277721AC549213EC (property_id), PRIMARY KEY(type_id, property_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_claimant (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, code VARCHAR(191) NOT NULL, UNIQUE INDEX UNIQ_D5B7FBD377153098 (code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_file (id INT AUTO_INCREMENT NOT NULL, created_by INT DEFAULT NULL, modified_by INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, date_upload DATETIME NOT NULL, module VARCHAR(255) NOT NULL, width INT DEFAULT 0 NOT NULL, height INT DEFAULT 0 NOT NULL, file_size int(18) NOT NULL, content_type VARCHAR(255) NOT NULL, sub_dir VARCHAR(255) NOT NULL, file_name VARCHAR(255) NOT NULL, original_name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, external_id VARCHAR(191) DEFAULT NULL, UNIQUE INDEX UNIQ_6C2C04729F75D7B0 (external_id), INDEX IDX_6C2C0472DE12AB56 (created_by), INDEX IDX_6C2C047225F94802 (modified_by), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_group (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, ou_id INT DEFAULT NULL, parent_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, anonymous TINYINT(1) DEFAULT 0 NOT NULL, active TINYINT(1) DEFAULT 1 NOT NULL, active_from DATETIME DEFAULT NULL, active_to DATETIME DEFAULT NULL, sort INT DEFAULT 100 NOT NULL, `level` INT DEFAULT 0 NOT NULL, name VARCHAR(255) NOT NULL, code VARCHAR(191) NOT NULL, description LONGTEXT DEFAULT NULL, UNIQUE INDEX UNIQ_CE9CF78377153098 (code), INDEX IDX_CE9CF783A76ED395 (user_id), INDEX IDX_CE9CF78318A15B0D (ou_id), INDEX IDX_CE9CF783727ACA70 (parent_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_group_access (id INT AUTO_INCREMENT NOT NULL, group_id INT DEFAULT NULL, claimant_id INT DEFAULT NULL, `level` INT DEFAULT 0 NOT NULL, INDEX IDX_CC57463DFE54D947 (group_id), INDEX IDX_CC57463D9F409843 (claimant_id), UNIQUE INDEX UNIQ_CC57463DFE54D9479F409843 (group_id, claimant_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_ou (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, code VARCHAR(191) NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, is_tutors TINYINT(1) DEFAULT 0 NOT NULL, sort INT DEFAULT 100 NOT NULL, UNIQUE INDEX UNIQ_5E9420FE77153098 (code), INDEX IDX_5E9420FEA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_role (id INT AUTO_INCREMENT NOT NULL, claimant_id INT DEFAULT NULL, code VARCHAR(191) NOT NULL, level INT DEFAULT 0 NOT NULL, INDEX IDX_B7DAB8089F409843 (claimant_id), UNIQUE INDEX UNIQ_B7DAB808771530989F409843 (code, claimant_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_stored_auth (id INT AUTO_INCREMENT NOT NULL, date_reg DATETIME NOT NULL, last_auth DATETIME NOT NULL, stored_hash VARCHAR(32) NOT NULL, temp_hash TINYINT(1) DEFAULT 1 NOT NULL, ip_addr TINYINT(1) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_user (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, ou_id INT DEFAULT NULL, login VARCHAR(191) NOT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, date_register DATETIME DEFAULT NULL, last_login DATETIME DEFAULT NULL, email VARCHAR(255) DEFAULT NULL, last_ip VARCHAR(40) DEFAULT NULL, active TINYINT(1) DEFAULT 1 NOT NULL, loocked TINYINT(1) DEFAULT 0 NOT NULL, phone VARCHAR(255) DEFAULT NULL, active_from DATETIME DEFAULT NULL, active_to DATETIME DEFAULT NULL, alias VARCHAR(255) DEFAULT NULL, first_name VARCHAR(255) DEFAULT NULL, second_name VARCHAR(255) DEFAULT NULL, patronymic VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, stored_hash VARCHAR(32) DEFAULT NULL, checkword VARCHAR(32) DEFAULT NULL, password VARCHAR(255) DEFAULT NULL, salt VARCHAR(255) DEFAULT NULL, gender VARCHAR(1) DEFAULT 'N', login_attempts INT DEFAULT 0 NOT NULL, country VARCHAR(10) DEFAULT 'RU' NOT NULL, roles JSON NOT NULL, options JSON NOT NULL, UNIQUE INDEX UNIQ_6D20E42BAA08CB10 (login), UNIQUE INDEX UNIQ_6D20E42B9E1EB3D4 (stored_hash), UNIQUE INDEX UNIQ_6D20E42BDB50E026 (checkword), INDEX IDX_6D20E42B727ACA70 (parent_id), INDEX IDX_6D20E42B18A15B0D (ou_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_user_access (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, claimant_id INT DEFAULT NULL, level INT DEFAULT 0 NOT NULL, INDEX IDX_B7B8F8FFA76ED395 (user_id), INDEX IDX_B7B8F8FF9F409843 (claimant_id), UNIQUE INDEX UNIQ_B7B8F8FFA76ED3959F409843 (user_id, claimant_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE main_user_group (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, group_id INT NOT NULL, active_from DATETIME DEFAULT NULL, active_to DATETIME DEFAULT NULL, INDEX IDX_B7FACBFEA76ED395 (user_id), INDEX IDX_B7FACBFEFE54D947 (group_id), UNIQUE INDEX UNIQ_B7FACBFEA76ED395FE54D947 (user_id, group_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_accounting ADD CONSTRAINT FK_3588D169727ACA70 FOREIGN KEY (parent_id) REFERENCES d_accounting (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5B727ACA70 FOREIGN KEY (parent_id) REFERENCES d_device (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5BC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5BFE54D947 FOREIGN KEY (group_id) REFERENCES d_type (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5B3B7DD068 FOREIGN KEY (accounting_id) REFERENCES d_accounting (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5BDE12AB56 FOREIGN KEY (created_by) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device ADD CONSTRAINT FK_5CF3FF5B25F94802 FOREIGN KEY (modified_by) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image ADD CONSTRAINT FK_125DB9E694A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image ADD CONSTRAINT FK_125DB9E693CB796C FOREIGN KEY (file_id) REFERENCES main_file (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history ADD CONSTRAINT FK_A76D7DEB94A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history ADD CONSTRAINT FK_A76D7DEB727ACA70 FOREIGN KEY (parent_id) REFERENCES d_device (id) ON DELETE CASCADE
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
            ALTER TABLE d_device_location ADD CONSTRAINT FK_88C8FD2E94A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
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
            ALTER TABLE d_device_property_enum ADD CONSTRAINT FK_AA9C5E942612472A FOREIGN KEY (device_property_id) REFERENCES d_device_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum ADD CONSTRAINT FK_AA9C5E9417628E55 FOREIGN KEY (enum_id) REFERENCES d_property_enum (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair ADD CONSTRAINT FK_3C8E5FB494A4C7D4 FOREIGN KEY (device_id) REFERENCES d_device (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key ADD CONSTRAINT FK_E45AD669F5503E07 FOREIGN KEY (license_software_id) REFERENCES d_license_software (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key ADD CONSTRAINT FK_E45AD669D7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software ADD CONSTRAINT FK_60D6ADEA460F904B FOREIGN KEY (license_id) REFERENCES d_license (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software ADD CONSTRAINT FK_60D6ADEAD7452741 FOREIGN KEY (software_id) REFERENCES d_software (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816C727ACA70 FOREIGN KEY (parent_id) REFERENCES d_property (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816CC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property ADD CONSTRAINT FK_78BD816C25998077 FOREIGN KEY (prototype_id) REFERENCES d_property (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_property_enum ADD CONSTRAINT FK_70DC0BE5549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57D727ACA70 FOREIGN KEY (parent_id) REFERENCES d_software (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software ADD CONSTRAINT FK_849FF57DC54C8C93 FOREIGN KEY (type_id) REFERENCES d_software_type (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type ADD CONSTRAINT FK_357E3CC0727ACA70 FOREIGN KEY (parent_id) REFERENCES d_type (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type ADD CONSTRAINT FK_357E3CC0549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property ADD CONSTRAINT FK_277721ACC54C8C93 FOREIGN KEY (type_id) REFERENCES d_type (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property ADD CONSTRAINT FK_277721AC549213EC FOREIGN KEY (property_id) REFERENCES d_property (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file ADD CONSTRAINT FK_6C2C0472DE12AB56 FOREIGN KEY (created_by) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file ADD CONSTRAINT FK_6C2C047225F94802 FOREIGN KEY (modified_by) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group ADD CONSTRAINT FK_CE9CF783A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group ADD CONSTRAINT FK_CE9CF78318A15B0D FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group ADD CONSTRAINT FK_CE9CF783727ACA70 FOREIGN KEY (parent_id) REFERENCES main_group (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group_access ADD CONSTRAINT FK_CC57463DFE54D947 FOREIGN KEY (group_id) REFERENCES main_group (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group_access ADD CONSTRAINT FK_CC57463D9F409843 FOREIGN KEY (claimant_id) REFERENCES main_claimant (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_ou ADD CONSTRAINT FK_5E9420FEA76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_role ADD CONSTRAINT FK_B7DAB8089F409843 FOREIGN KEY (claimant_id) REFERENCES main_claimant (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user ADD CONSTRAINT FK_6D20E42B727ACA70 FOREIGN KEY (parent_id) REFERENCES main_user (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user ADD CONSTRAINT FK_6D20E42B18A15B0D FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_access ADD CONSTRAINT FK_B7B8F8FFA76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_access ADD CONSTRAINT FK_B7B8F8FF9F409843 FOREIGN KEY (claimant_id) REFERENCES main_claimant (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_group ADD CONSTRAINT FK_B7FACBFEA76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_group ADD CONSTRAINT FK_B7FACBFEFE54D947 FOREIGN KEY (group_id) REFERENCES main_group (id) ON DELETE CASCADE
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE d_accounting DROP FOREIGN KEY FK_3588D169727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5B727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5BC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5BFE54D947
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5B3B7DD068
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5BDE12AB56
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device DROP FOREIGN KEY FK_5CF3FF5B25F94802
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image DROP FOREIGN KEY FK_125DB9E694A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_image DROP FOREIGN KEY FK_125DB9E693CB796C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history DROP FOREIGN KEY FK_A76D7DEB94A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_history DROP FOREIGN KEY FK_A76D7DEB727ACA70
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
            ALTER TABLE d_device_location DROP FOREIGN KEY FK_88C8FD2E94A4C7D4
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
            ALTER TABLE d_device_property_enum DROP FOREIGN KEY FK_AA9C5E942612472A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_property_enum DROP FOREIGN KEY FK_AA9C5E9417628E55
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_device_repair DROP FOREIGN KEY FK_3C8E5FB494A4C7D4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key DROP FOREIGN KEY FK_E45AD669F5503E07
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_key DROP FOREIGN KEY FK_E45AD669D7452741
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software DROP FOREIGN KEY FK_60D6ADEA460F904B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_license_software DROP FOREIGN KEY FK_60D6ADEAD7452741
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
            ALTER TABLE d_property_enum DROP FOREIGN KEY FK_70DC0BE5549213EC
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57D727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_software DROP FOREIGN KEY FK_849FF57DC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type DROP FOREIGN KEY FK_357E3CC0727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type DROP FOREIGN KEY FK_357E3CC0549213EC
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property DROP FOREIGN KEY FK_277721ACC54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE d_type_property DROP FOREIGN KEY FK_277721AC549213EC
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file DROP FOREIGN KEY FK_6C2C0472DE12AB56
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_file DROP FOREIGN KEY FK_6C2C047225F94802
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group DROP FOREIGN KEY FK_CE9CF783A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group DROP FOREIGN KEY FK_CE9CF78318A15B0D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group DROP FOREIGN KEY FK_CE9CF783727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group_access DROP FOREIGN KEY FK_CC57463DFE54D947
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_group_access DROP FOREIGN KEY FK_CC57463D9F409843
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_ou DROP FOREIGN KEY FK_5E9420FEA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_role DROP FOREIGN KEY FK_B7DAB8089F409843
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user DROP FOREIGN KEY FK_6D20E42B727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user DROP FOREIGN KEY FK_6D20E42B18A15B0D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_access DROP FOREIGN KEY FK_B7B8F8FFA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_access DROP FOREIGN KEY FK_B7B8F8FF9F409843
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_group DROP FOREIGN KEY FK_B7FACBFEA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE main_user_group DROP FOREIGN KEY FK_B7FACBFEFE54D947
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_accounting
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_image
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_history
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_license
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_location
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_device_repair
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_license
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_license_key
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_license_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_property_enum
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_software
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_software_type
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_type
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE d_type_property
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_claimant
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_file
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_group
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_group_access
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_ou
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_role
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_stored_auth
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_user_access
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE main_user_group
        SQL);
    }
}

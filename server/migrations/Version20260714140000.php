<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260714140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create iblock tables (type, property, block, section, element, property_enum)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_property (
                id INT AUTO_INCREMENT NOT NULL,
                parent_id INT DEFAULT NULL,
                type_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                date_created DATETIME DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(191) NOT NULL,
                active TINYINT(1) DEFAULT 1 NOT NULL,
                active_from DATETIME DEFAULT NULL,
                active_to DATETIME DEFAULT NULL,
                required TINYINT(1) DEFAULT 0 NOT NULL,
                multiple TINYINT(1) DEFAULT 0 NOT NULL,
                field_type VARCHAR(255) DEFAULT 's' NOT NULL,
                list_type VARCHAR(255) DEFAULT 's' NOT NULL,
                default_value VARCHAR(255) DEFAULT NULL,
                postfix VARCHAR(255) DEFAULT NULL,
                prefix VARCHAR(255) DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                description LONGTEXT DEFAULT NULL,
                INDEX IDX_IBLOCK_PROPERTY_PARENT (parent_id),
                UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_TYPE (type_id),
                UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_CODE (code),
                UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_PARENT_CODE (parent_id, code),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_type (
                id INT AUTO_INCREMENT NOT NULL,
                parent_id INT DEFAULT NULL,
                property_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                active TINYINT(1) DEFAULT 1 NOT NULL,
                sections TINYINT(1) DEFAULT 1 NOT NULL,
                active_from DATETIME DEFAULT NULL,
                active_to DATETIME DEFAULT NULL,
                code VARCHAR(191) NOT NULL,
                name VARCHAR(255) NOT NULL,
                sort INT DEFAULT 100 NOT NULL,
                description LONGTEXT DEFAULT NULL,
                INDEX IDX_IBLOCK_TYPE_PARENT (parent_id),
                UNIQUE INDEX UNIQ_IBLOCK_TYPE_PROPERTY (property_id),
                UNIQUE INDEX UNIQ_IBLOCK_TYPE_CODE (code),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_type_property (
                type_id INT NOT NULL,
                property_id INT NOT NULL,
                INDEX IDX_IBLOCK_TYPE_PROPERTY_TYPE (type_id),
                INDEX IDX_IBLOCK_TYPE_PROPERTY_PROPERTY (property_id),
                PRIMARY KEY(type_id, property_id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_block (
                id INT AUTO_INCREMENT NOT NULL,
                type_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                date_created DATETIME DEFAULT NULL,
                active TINYINT(1) DEFAULT 1 NOT NULL,
                sections TINYINT(1) DEFAULT 1 NOT NULL,
                property TINYINT(1) DEFAULT 0 NOT NULL,
                active_from DATETIME DEFAULT NULL,
                active_to DATETIME DEFAULT NULL,
                code VARCHAR(191) NOT NULL,
                name VARCHAR(255) NOT NULL,
                sort INT DEFAULT 100 NOT NULL,
                description LONGTEXT DEFAULT NULL,
                INDEX IDX_IBLOCK_BLOCK_TYPE (type_id),
                UNIQUE INDEX UNIQ_IBLOCK_BLOCK_CODE (code),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_section (
                id INT AUTO_INCREMENT NOT NULL,
                parent_id INT DEFAULT NULL,
                block_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                date_created DATETIME DEFAULT NULL,
                active TINYINT(1) DEFAULT 1 NOT NULL,
                active_from DATETIME DEFAULT NULL,
                active_to DATETIME DEFAULT NULL,
                code VARCHAR(191) NOT NULL,
                name VARCHAR(255) NOT NULL,
                sort INT DEFAULT 100 NOT NULL,
                level INT DEFAULT 0 NOT NULL,
                description LONGTEXT DEFAULT NULL,
                INDEX IDX_IBLOCK_SECTION_PARENT (parent_id),
                INDEX IDX_IBLOCK_SECTION_BLOCK (block_id),
                UNIQUE INDEX UNIQ_IBLOCK_SECTION_CODE (code),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_element (
                id INT AUTO_INCREMENT NOT NULL,
                block_id INT DEFAULT NULL,
                section_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                date_created DATETIME DEFAULT NULL,
                active TINYINT(1) DEFAULT 1 NOT NULL,
                active_from DATETIME DEFAULT NULL,
                active_to DATETIME DEFAULT NULL,
                code VARCHAR(191) NOT NULL,
                name VARCHAR(255) NOT NULL,
                sort INT DEFAULT 100 NOT NULL,
                description LONGTEXT DEFAULT NULL,
                preview_text LONGTEXT DEFAULT NULL,
                detail_text LONGTEXT DEFAULT NULL,
                INDEX IDX_IBLOCK_ELEMENT_BLOCK (block_id),
                INDEX IDX_IBLOCK_ELEMENT_SECTION (section_id),
                UNIQUE INDEX UNIQ_IBLOCK_ELEMENT_CODE (code),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE iblock_property_enum (
                id INT AUTO_INCREMENT NOT NULL,
                property_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(191) NOT NULL,
                `default` TINYINT(1) DEFAULT 0 NOT NULL,
                sort INT DEFAULT 100 NOT NULL,
                INDEX IDX_IBLOCK_PROPERTY_ENUM_PROPERTY (property_id),
                UNIQUE INDEX UNIQ_IBLOCK_PROPERTY_ENUM_PROPERTY_CODE (property_id, code),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql('ALTER TABLE iblock_property ADD CONSTRAINT FK_IBLOCK_PROPERTY_PARENT FOREIGN KEY (parent_id) REFERENCES iblock_property (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE iblock_property ADD CONSTRAINT FK_IBLOCK_PROPERTY_TYPE FOREIGN KEY (type_id) REFERENCES iblock_type (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE iblock_type ADD CONSTRAINT FK_IBLOCK_TYPE_PARENT FOREIGN KEY (parent_id) REFERENCES iblock_type (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE iblock_type ADD CONSTRAINT FK_IBLOCK_TYPE_PROPERTY FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE iblock_type_property ADD CONSTRAINT FK_IBLOCK_TYPE_PROPERTY_TYPE FOREIGN KEY (type_id) REFERENCES iblock_type (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE iblock_type_property ADD CONSTRAINT FK_IBLOCK_TYPE_PROPERTY_PROPERTY FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE iblock_block ADD CONSTRAINT FK_IBLOCK_BLOCK_TYPE FOREIGN KEY (type_id) REFERENCES iblock_type (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE iblock_section ADD CONSTRAINT FK_IBLOCK_SECTION_PARENT FOREIGN KEY (parent_id) REFERENCES iblock_section (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE iblock_section ADD CONSTRAINT FK_IBLOCK_SECTION_BLOCK FOREIGN KEY (block_id) REFERENCES iblock_block (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE iblock_element ADD CONSTRAINT FK_IBLOCK_ELEMENT_BLOCK FOREIGN KEY (block_id) REFERENCES iblock_block (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE iblock_element ADD CONSTRAINT FK_IBLOCK_ELEMENT_SECTION FOREIGN KEY (section_id) REFERENCES iblock_section (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE iblock_property_enum ADD CONSTRAINT FK_IBLOCK_PROPERTY_ENUM_PROPERTY FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE iblock_property_enum DROP FOREIGN KEY FK_IBLOCK_PROPERTY_ENUM_PROPERTY');
        $this->addSql('ALTER TABLE iblock_element DROP FOREIGN KEY FK_IBLOCK_ELEMENT_SECTION');
        $this->addSql('ALTER TABLE iblock_element DROP FOREIGN KEY FK_IBLOCK_ELEMENT_BLOCK');
        $this->addSql('ALTER TABLE iblock_section DROP FOREIGN KEY FK_IBLOCK_SECTION_BLOCK');
        $this->addSql('ALTER TABLE iblock_section DROP FOREIGN KEY FK_IBLOCK_SECTION_PARENT');
        $this->addSql('ALTER TABLE iblock_block DROP FOREIGN KEY FK_IBLOCK_BLOCK_TYPE');
        $this->addSql('ALTER TABLE iblock_type_property DROP FOREIGN KEY FK_IBLOCK_TYPE_PROPERTY_PROPERTY');
        $this->addSql('ALTER TABLE iblock_type_property DROP FOREIGN KEY FK_IBLOCK_TYPE_PROPERTY_TYPE');
        $this->addSql('ALTER TABLE iblock_type DROP FOREIGN KEY FK_IBLOCK_TYPE_PROPERTY');
        $this->addSql('ALTER TABLE iblock_type DROP FOREIGN KEY FK_IBLOCK_TYPE_PARENT');
        $this->addSql('ALTER TABLE iblock_property DROP FOREIGN KEY FK_IBLOCK_PROPERTY_TYPE');
        $this->addSql('ALTER TABLE iblock_property DROP FOREIGN KEY FK_IBLOCK_PROPERTY_PARENT');

        $this->addSql('DROP TABLE iblock_property_enum');
        $this->addSql('DROP TABLE iblock_element');
        $this->addSql('DROP TABLE iblock_section');
        $this->addSql('DROP TABLE iblock_block');
        $this->addSql('DROP TABLE iblock_type_property');
        $this->addSql('DROP TABLE iblock_type');
        $this->addSql('DROP TABLE iblock_property');
    }
}

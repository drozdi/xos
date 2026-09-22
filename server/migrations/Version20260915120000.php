<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260915120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: property.block_id + iblock_element_property values';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_property') && !$this->columnExists('iblock_property', 'block_id')) {
            $this->addSql('ALTER TABLE iblock_property ADD block_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_IBLOCK_PROPERTY_BLOCK ON iblock_property (block_id)');
            if ($this->tableExists('iblock_block')) {
                $this->addSql('ALTER TABLE iblock_property ADD CONSTRAINT FK_IBLOCK_PROPERTY_BLOCK FOREIGN KEY (block_id) REFERENCES iblock_block (id) ON DELETE CASCADE');
            }
        }

        if (!$this->tableExists('iblock_element_property')) {
            $this->addSql('CREATE TABLE iblock_element_property (
                id INT AUTO_INCREMENT NOT NULL,
                element_id INT NOT NULL,
                property_id INT NOT NULL,
                value LONGTEXT DEFAULT NULL,
                value_num DOUBLE PRECISION DEFAULT NULL,
                value_enum_id INT DEFAULT NULL,
                description VARCHAR(255) DEFAULT NULL,
                INDEX idx_iblock_ep_element_property (element_id, property_id),
                INDEX IDX_IBLOCK_EP_ELEMENT (element_id),
                INDEX IDX_IBLOCK_EP_PROPERTY (property_id),
                INDEX IDX_IBLOCK_EP_ENUM (value_enum_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

            if ($this->tableExists('iblock_element')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_ELEMENT FOREIGN KEY (element_id) REFERENCES iblock_element (id) ON DELETE CASCADE');
            }
            if ($this->tableExists('iblock_property')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_PROPERTY FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
            }
            if ($this->tableExists('iblock_property_enum')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_ENUM FOREIGN KEY (value_enum_id) REFERENCES iblock_property_enum (id) ON DELETE SET NULL');
            }
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_element_property')) {
            $this->addSql('DROP TABLE iblock_element_property');
        }
        if ($this->tableExists('iblock_property') && $this->columnExists('iblock_property', 'block_id')) {
            $this->addSql('ALTER TABLE iblock_property DROP FOREIGN KEY FK_IBLOCK_PROPERTY_BLOCK');
            $this->addSql('DROP INDEX IDX_IBLOCK_PROPERTY_BLOCK ON iblock_property');
            $this->addSql('ALTER TABLE iblock_property DROP block_id');
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$table],
        ) > 0;
    }

    private function columnExists(string $table, string $column): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
            [$table, $column],
        ) > 0;
    }
}

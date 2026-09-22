<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260915140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: property link_iblock_id + element_property F/E/G FKs (file/element/section)';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_property') && !$this->columnExists('iblock_property', 'link_iblock_id')) {
            $this->addSql('ALTER TABLE iblock_property ADD link_iblock_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_IBLOCK_PROP_LINK_IBLOCK ON iblock_property (link_iblock_id)');
            $this->addSql('ALTER TABLE iblock_property ADD CONSTRAINT FK_IBLOCK_PROP_LINK_IBLOCK
                FOREIGN KEY (link_iblock_id) REFERENCES iblock_block (id) ON DELETE SET NULL');
        }

        if ($this->tableExists('iblock_element_property')) {
            if (!$this->columnExists('iblock_element_property', 'value_file_id')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_file_id INT DEFAULT NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_EP_VALUE_FILE ON iblock_element_property (value_file_id)');
                $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_VALUE_FILE
                    FOREIGN KEY (value_file_id) REFERENCES main_file (id) ON DELETE SET NULL');
            }
            if (!$this->columnExists('iblock_element_property', 'value_element_id')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_element_id INT DEFAULT NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_EP_VALUE_ELEMENT ON iblock_element_property (value_element_id)');
                $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_VALUE_ELEMENT
                    FOREIGN KEY (value_element_id) REFERENCES iblock_element (id) ON DELETE SET NULL');
            }
            if (!$this->columnExists('iblock_element_property', 'value_section_id')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_section_id INT DEFAULT NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_EP_VALUE_SECTION ON iblock_element_property (value_section_id)');
                $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_VALUE_SECTION
                    FOREIGN KEY (value_section_id) REFERENCES iblock_section (id) ON DELETE SET NULL');
            }
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_element_property')) {
            if ($this->foreignKeyExists('iblock_element_property', 'FK_IBLOCK_EP_VALUE_FILE')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP FOREIGN KEY FK_IBLOCK_EP_VALUE_FILE');
            }
            if ($this->foreignKeyExists('iblock_element_property', 'FK_IBLOCK_EP_VALUE_ELEMENT')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP FOREIGN KEY FK_IBLOCK_EP_VALUE_ELEMENT');
            }
            if ($this->foreignKeyExists('iblock_element_property', 'FK_IBLOCK_EP_VALUE_SECTION')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP FOREIGN KEY FK_IBLOCK_EP_VALUE_SECTION');
            }
            if ($this->columnExists('iblock_element_property', 'value_file_id')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP value_file_id');
            }
            if ($this->columnExists('iblock_element_property', 'value_element_id')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP value_element_id');
            }
            if ($this->columnExists('iblock_element_property', 'value_section_id')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP value_section_id');
            }
        }

        if ($this->tableExists('iblock_property')) {
            if ($this->foreignKeyExists('iblock_property', 'FK_IBLOCK_PROP_LINK_IBLOCK')) {
                $this->addSql('ALTER TABLE iblock_property DROP FOREIGN KEY FK_IBLOCK_PROP_LINK_IBLOCK');
            }
            if ($this->columnExists('iblock_property', 'link_iblock_id')) {
                $this->addSql('ALTER TABLE iblock_property DROP link_iblock_id');
            }
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = ?',
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

    private function foreignKeyExists(string $table, string $constraintName): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.table_constraints
             WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = ?',
            [$table, $constraintName, 'FOREIGN KEY'],
        ) > 0;
    }
}

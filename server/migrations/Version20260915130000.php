<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260915130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: element_property Device-style (value_s/value_n/M2M) + iblock_section_property';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_element_property')) {
            if (!$this->columnExists('iblock_element_property', 'value_s')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_s VARCHAR(255) DEFAULT NULL');
            }

            if ($this->columnExists('iblock_element_property', 'value_num')
                && !$this->columnExists('iblock_element_property', 'value_n')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_n DOUBLE PRECISION DEFAULT NULL');
                $this->addSql('UPDATE iblock_element_property SET value_n = value_num WHERE value_num IS NOT NULL');
                $this->addSql('ALTER TABLE iblock_element_property DROP value_num');
            } elseif (!$this->columnExists('iblock_element_property', 'value_n')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_n DOUBLE PRECISION DEFAULT NULL');
            }

            if (!$this->tableExists('iblock_element_property_enum')) {
                $this->addSql('CREATE TABLE iblock_element_property_enum (
                    element_property_id INT NOT NULL,
                    enum_id INT NOT NULL,
                    INDEX IDX_IBLOCK_EP_ENUM_EP (element_property_id),
                    INDEX IDX_IBLOCK_EP_ENUM_ENUM (enum_id),
                    PRIMARY KEY(element_property_id, enum_id)
                ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

                if ($this->tableExists('iblock_element_property')) {
                    $this->addSql('ALTER TABLE iblock_element_property_enum ADD CONSTRAINT FK_IBLOCK_EP_ENUM_EP FOREIGN KEY (element_property_id) REFERENCES iblock_element_property (id) ON DELETE CASCADE');
                }
                if ($this->tableExists('iblock_property_enum')) {
                    $this->addSql('ALTER TABLE iblock_element_property_enum ADD CONSTRAINT FK_IBLOCK_EP_ENUM_ENUM FOREIGN KEY (enum_id) REFERENCES iblock_property_enum (id) ON DELETE CASCADE');
                }
            }

            if ($this->columnExists('iblock_element_property', 'value_enum_id')) {
                if ($this->tableExists('iblock_element_property_enum')) {
                    $this->addSql('INSERT IGNORE INTO iblock_element_property_enum (element_property_id, enum_id)
                        SELECT id, value_enum_id FROM iblock_element_property WHERE value_enum_id IS NOT NULL');
                }

                if ($this->foreignKeyExists('iblock_element_property', 'FK_IBLOCK_EP_ENUM')) {
                    $this->addSql('ALTER TABLE iblock_element_property DROP FOREIGN KEY FK_IBLOCK_EP_ENUM');
                }
                if ($this->indexExists('iblock_element_property', 'IDX_IBLOCK_EP_ENUM')) {
                    $this->addSql('DROP INDEX IDX_IBLOCK_EP_ENUM ON iblock_element_property');
                }
                $this->addSql('ALTER TABLE iblock_element_property DROP value_enum_id');
            }
        }

        if (!$this->tableExists('iblock_section_property')) {
            $this->addSql('CREATE TABLE iblock_section_property (
                id INT AUTO_INCREMENT NOT NULL,
                section_id INT NOT NULL,
                property_id INT NOT NULL,
                block_id INT DEFAULT NULL,
                smart_filter TINYINT(1) DEFAULT 0 NOT NULL,
                display_type VARCHAR(32) DEFAULT \'A\' NOT NULL,
                display_expanded TINYINT(1) DEFAULT 0 NOT NULL,
                sort INT DEFAULT 100 NOT NULL,
                active TINYINT(1) DEFAULT 1 NOT NULL,
                UNIQUE INDEX uniq_iblock_section_property (section_id, property_id),
                INDEX IDX_IBLOCK_SP_SECTION (section_id),
                INDEX IDX_IBLOCK_SP_PROPERTY (property_id),
                INDEX IDX_IBLOCK_SP_BLOCK (block_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

            if ($this->tableExists('iblock_section')) {
                $this->addSql('ALTER TABLE iblock_section_property ADD CONSTRAINT FK_IBLOCK_SP_SECTION FOREIGN KEY (section_id) REFERENCES iblock_section (id) ON DELETE CASCADE');
            }
            if ($this->tableExists('iblock_property')) {
                $this->addSql('ALTER TABLE iblock_section_property ADD CONSTRAINT FK_IBLOCK_SP_PROPERTY FOREIGN KEY (property_id) REFERENCES iblock_property (id) ON DELETE CASCADE');
            }
            if ($this->tableExists('iblock_block')) {
                $this->addSql('ALTER TABLE iblock_section_property ADD CONSTRAINT FK_IBLOCK_SP_BLOCK FOREIGN KEY (block_id) REFERENCES iblock_block (id) ON DELETE CASCADE');
            }
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_section_property')) {
            $this->addSql('DROP TABLE iblock_section_property');
        }

        if ($this->tableExists('iblock_element_property_enum')) {
            $this->addSql('DROP TABLE iblock_element_property_enum');
        }

        if ($this->tableExists('iblock_element_property')) {
            if (!$this->columnExists('iblock_element_property', 'value_enum_id')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_enum_id INT DEFAULT NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_EP_ENUM ON iblock_element_property (value_enum_id)');
                if ($this->tableExists('iblock_property_enum')) {
                    $this->addSql('ALTER TABLE iblock_element_property ADD CONSTRAINT FK_IBLOCK_EP_ENUM FOREIGN KEY (value_enum_id) REFERENCES iblock_property_enum (id) ON DELETE SET NULL');
                }
            }
            if ($this->columnExists('iblock_element_property', 'value_s')) {
                $this->addSql('ALTER TABLE iblock_element_property DROP value_s');
            }
            if ($this->columnExists('iblock_element_property', 'value_n')
                && !$this->columnExists('iblock_element_property', 'value_num')) {
                $this->addSql('ALTER TABLE iblock_element_property ADD value_num DOUBLE PRECISION DEFAULT NULL');
                $this->addSql('UPDATE iblock_element_property SET value_num = value_n WHERE value_n IS NOT NULL');
                $this->addSql('ALTER TABLE iblock_element_property DROP value_n');
            }
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

    private function foreignKeyExists(string $table, string $constraintName): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.table_constraints
             WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = ?',
            [$table, $constraintName, 'FOREIGN KEY'],
        ) > 0;
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
            [$table, $indexName],
        ) > 0;
    }
}

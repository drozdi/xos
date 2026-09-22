<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260918120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: section_element M:N, section.element_filter, block.section_mode';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_block') && !$this->columnExists('iblock_block', 'section_mode')) {
            $this->addSql("ALTER TABLE iblock_block ADD section_mode VARCHAR(32) NOT NULL DEFAULT 'tree'");
        }

        if ($this->tableExists('iblock_section') && !$this->columnExists('iblock_section', 'element_filter')) {
            $this->addSql('ALTER TABLE iblock_section ADD element_filter JSON DEFAULT NULL');
        }

        if (!$this->tableExists('iblock_section_element')) {
            $this->addSql('CREATE TABLE iblock_section_element (
                id INT AUTO_INCREMENT NOT NULL,
                section_id INT NOT NULL,
                element_id INT NOT NULL,
                additional_property_id INT NOT NULL DEFAULT 0,
                INDEX IDX_IBLOCK_SE_SECTION (section_id),
                INDEX IDX_IBLOCK_SE_ELEMENT (element_id),
                UNIQUE INDEX UNIQ_IBLOCK_SECTION_ELEMENT (section_id, element_id, additional_property_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

            if ($this->tableExists('iblock_section')) {
                $this->addSql('ALTER TABLE iblock_section_element ADD CONSTRAINT FK_IBLOCK_SE_SECTION
                    FOREIGN KEY (section_id) REFERENCES iblock_section (id) ON DELETE CASCADE');
            }
            if ($this->tableExists('iblock_element')) {
                $this->addSql('ALTER TABLE iblock_section_element ADD CONSTRAINT FK_IBLOCK_SE_ELEMENT
                    FOREIGN KEY (element_id) REFERENCES iblock_element (id) ON DELETE CASCADE');
            }
        }

        if ($this->tableExists('iblock_element') && $this->tableExists('iblock_section_element')) {
            $this->addSql('INSERT IGNORE INTO iblock_section_element (section_id, element_id, additional_property_id)
                SELECT section_id, id, 0 FROM iblock_element WHERE section_id IS NOT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_section_element')) {
            $this->addSql('DROP TABLE iblock_section_element');
        }
        if ($this->tableExists('iblock_section') && $this->columnExists('iblock_section', 'element_filter')) {
            $this->addSql('ALTER TABLE iblock_section DROP element_filter');
        }
        if ($this->tableExists('iblock_block') && $this->columnExists('iblock_block', 'section_mode')) {
            $this->addSql('ALTER TABLE iblock_block DROP section_mode');
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
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260923220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IBlock: created_by/updated_by on element+section; element share (view-only)';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('iblock_element')) {
            if (!$this->columnExists('iblock_element', 'created_by_id')) {
                $this->addSql('ALTER TABLE iblock_element ADD created_by_id INT DEFAULT NULL');
                $this->addSql('ALTER TABLE iblock_element ADD CONSTRAINT FK_IBLOCK_ELEMENT_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_ELEMENT_CREATED_BY ON iblock_element (created_by_id)');
            }
            if (!$this->columnExists('iblock_element', 'updated_by_id')) {
                $this->addSql('ALTER TABLE iblock_element ADD updated_by_id INT DEFAULT NULL');
                $this->addSql('ALTER TABLE iblock_element ADD CONSTRAINT FK_IBLOCK_ELEMENT_UPDATED_BY FOREIGN KEY (updated_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_ELEMENT_UPDATED_BY ON iblock_element (updated_by_id)');
            }
        }

        if ($this->tableExists('iblock_section')) {
            if (!$this->columnExists('iblock_section', 'created_by_id')) {
                $this->addSql('ALTER TABLE iblock_section ADD created_by_id INT DEFAULT NULL');
                $this->addSql('ALTER TABLE iblock_section ADD CONSTRAINT FK_IBLOCK_SECTION_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_SECTION_CREATED_BY ON iblock_section (created_by_id)');
            }
            if (!$this->columnExists('iblock_section', 'updated_by_id')) {
                $this->addSql('ALTER TABLE iblock_section ADD updated_by_id INT DEFAULT NULL');
                $this->addSql('ALTER TABLE iblock_section ADD CONSTRAINT FK_IBLOCK_SECTION_UPDATED_BY FOREIGN KEY (updated_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
                $this->addSql('CREATE INDEX IDX_IBLOCK_SECTION_UPDATED_BY ON iblock_section (updated_by_id)');
            }
        }

        if (!$this->tableExists('iblock_element_share')) {
            $this->addSql('CREATE TABLE iblock_element_share (id INT AUTO_INCREMENT NOT NULL, element_id INT NOT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_IBLOCK_ELEMENT_SHARE (element_id, user_id), INDEX IDX_IBLOCK_ELEMENT_SHARE_ELEMENT (element_id), INDEX IDX_IBLOCK_ELEMENT_SHARE_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE iblock_element_share ADD CONSTRAINT FK_IBLOCK_ELEMENT_SHARE_ELEMENT FOREIGN KEY (element_id) REFERENCES iblock_element (id) ON DELETE CASCADE');
            $this->addSql('ALTER TABLE iblock_element_share ADD CONSTRAINT FK_IBLOCK_ELEMENT_SHARE_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('iblock_element_share')) {
            $this->addSql('DROP TABLE iblock_element_share');
        }
        if ($this->tableExists('iblock_element')) {
            if ($this->columnExists('iblock_element', 'updated_by_id')) {
                $this->addSql('ALTER TABLE iblock_element DROP FOREIGN KEY FK_IBLOCK_ELEMENT_UPDATED_BY');
                $this->addSql('DROP INDEX IDX_IBLOCK_ELEMENT_UPDATED_BY ON iblock_element');
                $this->addSql('ALTER TABLE iblock_element DROP updated_by_id');
            }
            if ($this->columnExists('iblock_element', 'created_by_id')) {
                $this->addSql('ALTER TABLE iblock_element DROP FOREIGN KEY FK_IBLOCK_ELEMENT_CREATED_BY');
                $this->addSql('DROP INDEX IDX_IBLOCK_ELEMENT_CREATED_BY ON iblock_element');
                $this->addSql('ALTER TABLE iblock_element DROP created_by_id');
            }
        }
        if ($this->tableExists('iblock_section')) {
            if ($this->columnExists('iblock_section', 'updated_by_id')) {
                $this->addSql('ALTER TABLE iblock_section DROP FOREIGN KEY FK_IBLOCK_SECTION_UPDATED_BY');
                $this->addSql('DROP INDEX IDX_IBLOCK_SECTION_UPDATED_BY ON iblock_section');
                $this->addSql('ALTER TABLE iblock_section DROP updated_by_id');
            }
            if ($this->columnExists('iblock_section', 'created_by_id')) {
                $this->addSql('ALTER TABLE iblock_section DROP FOREIGN KEY FK_IBLOCK_SECTION_CREATED_BY');
                $this->addSql('DROP INDEX IDX_IBLOCK_SECTION_CREATED_BY ON iblock_section');
                $this->addSql('ALTER TABLE iblock_section DROP created_by_id');
            }
        }
    }

    private function tableExists(string $table): bool
    {
        $sm = $this->connection->createSchemaManager();

        return $sm->tablesExist([$table]);
    }

    private function columnExists(string $table, string $column): bool
    {
        $sm = $this->connection->createSchemaManager();
        if (!$sm->tablesExist([$table])) {
            return false;
        }
        $columns = $sm->listTableColumns($table);

        return isset($columns[$column]);
    }
}

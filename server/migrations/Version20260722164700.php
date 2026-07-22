<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260722164700 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'SchoolTask: graduates flag on parallel (st_ep_group)';
    }

    public function up(Schema $schema): void
    {
        if (!$schema->hasTable('st_ep_group')) {
            return;
        }
        $table = $schema->getTable('st_ep_group');
        if ($table->hasColumn('graduates')) {
            return;
        }
        $this->addSql('ALTER TABLE st_ep_group ADD graduates TINYINT(1) DEFAULT 0 NOT NULL');
        // Миграция прежних 9/11 по имени/коду параллели
        $this->addSql(<<<'SQL'
            UPDATE st_ep_group
            SET graduates = 1
            WHERE parent_id IS NULL
              AND (
                name REGEXP '^(9|11)([^0-9]|$)'
                OR code REGEXP '(class_|parallel_)(9|11)(_|$)'
              )
        SQL);
    }

    public function down(Schema $schema): void
    {
        if (!$schema->hasTable('st_ep_group')) {
            return;
        }
        $table = $schema->getTable('st_ep_group');
        if ($table->hasColumn('graduates')) {
            $this->addSql('ALTER TABLE st_ep_group DROP graduates');
        }
    }
}

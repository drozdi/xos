<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260722123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'SchoolTask: lesson_number and repeat_until on st_ep_event';
    }

    public function up(Schema $schema): void
    {
        if (!$schema->hasTable('st_ep_event')) {
            return;
        }
        $table = $schema->getTable('st_ep_event');
        if (!$table->hasColumn('lesson_number')) {
            $this->addSql('ALTER TABLE st_ep_event ADD lesson_number SMALLINT DEFAULT NULL');
        }
        if (!$table->hasColumn('repeat_until')) {
            $this->addSql('ALTER TABLE st_ep_event ADD repeat_until DATETIME DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if (!$schema->hasTable('st_ep_event')) {
            return;
        }
        $table = $schema->getTable('st_ep_event');
        if ($table->hasColumn('lesson_number') || $table->hasColumn('repeat_until')) {
            $drops = [];
            if ($table->hasColumn('lesson_number')) {
                $drops[] = 'DROP lesson_number';
            }
            if ($table->hasColumn('repeat_until')) {
                $drops[] = 'DROP repeat_until';
            }
            $this->addSql('ALTER TABLE st_ep_event '.implode(', ', $drops));
        }
    }
}


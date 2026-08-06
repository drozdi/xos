<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Add access_options JSON catalog to main_claimant (NOT NULL, default {}).
 */
final class Version20260806090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add main_claimant.access_options JSON NOT NULL DEFAULT {}';
    }

    public function up(Schema $schema): void
    {
        // Nullable first so existing rows can be backfilled before NOT NULL.
        $this->addSql('ALTER TABLE main_claimant ADD access_options JSON DEFAULT NULL');
        $this->addSql("UPDATE main_claimant SET access_options = '{}' WHERE access_options IS NULL");
        $this->addSql("ALTER TABLE main_claimant CHANGE access_options access_options JSON NOT NULL DEFAULT ('{}')");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE main_claimant DROP access_options');
    }
}

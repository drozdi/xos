<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Full schema for an empty database. Skipped when main_user already exists,
 * so existing installations are not rebuilt. Historical migrations stay in place.
 */
final class Version20260801000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Baseline schema for empty databases';
    }

    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        if ($this->connection->createSchemaManager()->tablesExist(['main_user'])) {
            return;
        }

        $statements = require __DIR__.'/baseline.sql.php';
        foreach ($statements as $statement) {
            $this->addSql($statement);
        }
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException();
    }
}

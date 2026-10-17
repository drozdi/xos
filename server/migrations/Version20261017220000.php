<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261017220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop Assets module tables';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('as_contract')) {
            $this->addSql('DROP TABLE as_contract');
        }
        foreach (['as_warehouse_item', 'as_fleet_vehicle', 'as_counterparty', 'as_room', 'as_soft_package'] as $table) {
            if ($this->tableExists($table)) {
                $this->addSql('DROP TABLE '.$table);
            }
        }
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Assets module tables are not recreated');
    }

    private function tableExists(string $table): bool
    {
        return $this->connection->createSchemaManager()->tablesExist([$table]);
    }
}

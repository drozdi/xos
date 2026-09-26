<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Assets module: warehouse, fleet, counterparty, contract, room, soft_package tables';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('as_warehouse_item')) {
            $this->addSql('CREATE TABLE as_warehouse_item (
                id INT AUTO_INCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(64) DEFAULT NULL,
                qty NUMERIC(16, 3) DEFAULT \'0\' NOT NULL,
                unit VARCHAR(32) DEFAULT NULL,
                location VARCHAR(255) DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }

        if (!$this->tableExists('as_fleet_vehicle')) {
            $this->addSql('CREATE TABLE as_fleet_vehicle (
                id INT AUTO_INCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                plate VARCHAR(32) DEFAULT NULL,
                vin VARCHAR(64) DEFAULT NULL,
                brand VARCHAR(128) DEFAULT NULL,
                model VARCHAR(128) DEFAULT NULL,
                year INT DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }

        if (!$this->tableExists('as_counterparty')) {
            $this->addSql('CREATE TABLE as_counterparty (
                id INT AUTO_INCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                inn VARCHAR(32) DEFAULT NULL,
                phone VARCHAR(64) DEFAULT NULL,
                email VARCHAR(255) DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }

        if (!$this->tableExists('as_contract')) {
            $this->addSql('CREATE TABLE as_contract (
                id INT AUTO_INCREMENT NOT NULL,
                party_id INT DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                number VARCHAR(64) DEFAULT NULL,
                date_from DATETIME DEFAULT NULL,
                date_to DATETIME DEFAULT NULL,
                amount NUMERIC(16, 2) DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                INDEX IDX_as_contract_party (party_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE as_contract ADD CONSTRAINT FK_as_contract_party FOREIGN KEY (party_id) REFERENCES as_counterparty (id) ON DELETE SET NULL');
        } elseif (!$this->columnExists('as_contract', 'party_id')) {
            $this->addSql('ALTER TABLE as_contract ADD party_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_as_contract_party ON as_contract (party_id)');
            $this->addSql('ALTER TABLE as_contract ADD CONSTRAINT FK_as_contract_party FOREIGN KEY (party_id) REFERENCES as_counterparty (id) ON DELETE SET NULL');
        }

        if (!$this->tableExists('as_room')) {
            $this->addSql('CREATE TABLE as_room (
                id INT AUTO_INCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                building VARCHAR(255) DEFAULT NULL,
                floor VARCHAR(64) DEFAULT NULL,
                area NUMERIC(12, 2) DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }

        if (!$this->tableExists('as_soft_package')) {
            $this->addSql('CREATE TABLE as_soft_package (
                id INT AUTO_INCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                vendor VARCHAR(255) DEFAULT NULL,
                version VARCHAR(64) DEFAULT NULL,
                license_type VARCHAR(64) DEFAULT NULL,
                seats INT DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                sort INT DEFAULT 100 NOT NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('as_contract')) {
            $this->addSql('ALTER TABLE as_contract DROP FOREIGN KEY FK_as_contract_party');
            $this->addSql('DROP TABLE as_contract');
        }
        if ($this->tableExists('as_warehouse_item')) {
            $this->addSql('DROP TABLE as_warehouse_item');
        }
        if ($this->tableExists('as_fleet_vehicle')) {
            $this->addSql('DROP TABLE as_fleet_vehicle');
        }
        if ($this->tableExists('as_counterparty')) {
            $this->addSql('DROP TABLE as_counterparty');
        }
        if ($this->tableExists('as_room')) {
            $this->addSql('DROP TABLE as_room');
        }
        if ($this->tableExists('as_soft_package')) {
            $this->addSql('DROP TABLE as_soft_package');
        }
    }

    private function tableExists(string $table): bool
    {
        return $this->connection->createSchemaManager()->tablesExist([$table]);
    }

    private function columnExists(string $table, string $column): bool
    {
        $sm = $this->connection->createSchemaManager();
        if (!$sm->tablesExist([$table])) {
            return false;
        }

        return \array_key_exists($column, $sm->listTableColumns($table));
    }
}

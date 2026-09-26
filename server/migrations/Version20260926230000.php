<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926230000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Assets: nullable ou_id tenancy on catalog tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE as_warehouse_item ADD ou_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE as_warehouse_item ADD CONSTRAINT FK_AS_WAREHOUSE_OU FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_AS_WAREHOUSE_OU ON as_warehouse_item (ou_id)');

        $this->addSql('ALTER TABLE as_contract ADD ou_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE as_contract ADD CONSTRAINT FK_AS_CONTRACT_OU FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_AS_CONTRACT_OU ON as_contract (ou_id)');

        $this->addSql('ALTER TABLE as_room ADD ou_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE as_room ADD CONSTRAINT FK_AS_ROOM_OU FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_AS_ROOM_OU ON as_room (ou_id)');

        $this->addSql('ALTER TABLE as_counterparty ADD ou_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE as_counterparty ADD CONSTRAINT FK_AS_PARTY_OU FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_AS_PARTY_OU ON as_counterparty (ou_id)');

        $this->addSql('ALTER TABLE as_fleet_vehicle ADD ou_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE as_fleet_vehicle ADD CONSTRAINT FK_AS_FLEET_OU FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_AS_FLEET_OU ON as_fleet_vehicle (ou_id)');

        $this->addSql('ALTER TABLE as_soft_package ADD ou_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE as_soft_package ADD CONSTRAINT FK_AS_SOFT_OU FOREIGN KEY (ou_id) REFERENCES main_ou (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_AS_SOFT_OU ON as_soft_package (ou_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE as_warehouse_item DROP FOREIGN KEY FK_AS_WAREHOUSE_OU');
        $this->addSql('DROP INDEX IDX_AS_WAREHOUSE_OU ON as_warehouse_item');
        $this->addSql('ALTER TABLE as_warehouse_item DROP ou_id');

        $this->addSql('ALTER TABLE as_contract DROP FOREIGN KEY FK_AS_CONTRACT_OU');
        $this->addSql('DROP INDEX IDX_AS_CONTRACT_OU ON as_contract');
        $this->addSql('ALTER TABLE as_contract DROP ou_id');

        $this->addSql('ALTER TABLE as_room DROP FOREIGN KEY FK_AS_ROOM_OU');
        $this->addSql('DROP INDEX IDX_AS_ROOM_OU ON as_room');
        $this->addSql('ALTER TABLE as_room DROP ou_id');

        $this->addSql('ALTER TABLE as_counterparty DROP FOREIGN KEY FK_AS_PARTY_OU');
        $this->addSql('DROP INDEX IDX_AS_PARTY_OU ON as_counterparty');
        $this->addSql('ALTER TABLE as_counterparty DROP ou_id');

        $this->addSql('ALTER TABLE as_fleet_vehicle DROP FOREIGN KEY FK_AS_FLEET_OU');
        $this->addSql('DROP INDEX IDX_AS_FLEET_OU ON as_fleet_vehicle');
        $this->addSql('ALTER TABLE as_fleet_vehicle DROP ou_id');

        $this->addSql('ALTER TABLE as_soft_package DROP FOREIGN KEY FK_AS_SOFT_OU');
        $this->addSql('DROP INDEX IDX_AS_SOFT_OU ON as_soft_package');
        $this->addSql('ALTER TABLE as_soft_package DROP ou_id');
    }
}

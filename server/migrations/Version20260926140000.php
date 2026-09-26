<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Todo board_card_id; IncCom transaction device_id soft links';
    }

    public function up(Schema $schema): void
    {
        if ($this->tableExists('todo_item') && !$this->columnExists('todo_item', 'board_card_id')) {
            $this->addSql('ALTER TABLE todo_item ADD board_card_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_todo_item_board_card ON todo_item (board_card_id)');
        }

        if ($this->tableExists('inccom_transaction') && !$this->columnExists('inccom_transaction', 'device_id')) {
            $this->addSql('ALTER TABLE inccom_transaction ADD device_id INT DEFAULT NULL');
            $this->addSql('CREATE INDEX IDX_inccom_transaction_device ON inccom_transaction (device_id)');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->tableExists('todo_item') && $this->columnExists('todo_item', 'board_card_id')) {
            $this->addSql('DROP INDEX IDX_todo_item_board_card ON todo_item');
            $this->addSql('ALTER TABLE todo_item DROP board_card_id');
        }

        if ($this->tableExists('inccom_transaction') && $this->columnExists('inccom_transaction', 'device_id')) {
            $this->addSql('DROP INDEX IDX_inccom_transaction_device ON inccom_transaction');
            $this->addSql('ALTER TABLE inccom_transaction DROP device_id');
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

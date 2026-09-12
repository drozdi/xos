<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260907180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IncCom FNS credentials + transaction receipt_json';
    }

    public function up(Schema $schema): void
    {
        if (!$this->tableExists('inccom_user_fns_credential')) {
            $this->addSql('CREATE TABLE inccom_user_fns_credential (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                server VARCHAR(512) NOT NULL,
                username VARCHAR(255) NOT NULL,
                master_token LONGTEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                UNIQUE INDEX uniq_inccom_user_fns_credential_user (user_id),
                INDEX IDX_inccom_user_fns_credential_user (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE inccom_user_fns_credential
                ADD CONSTRAINT FK_inccom_user_fns_credential_user
                FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        }

        if (!$this->columnExists('inccom_transaction', 'receipt_json')) {
            $this->addSql('ALTER TABLE inccom_transaction ADD receipt_json JSON DEFAULT NULL');
        }
        if (!$this->columnExists('inccom_transaction', 'receipt_checked_at')) {
            $this->addSql('ALTER TABLE inccom_transaction ADD receipt_checked_at DATETIME DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        if ($this->columnExists('inccom_transaction', 'receipt_checked_at')) {
            $this->addSql('ALTER TABLE inccom_transaction DROP receipt_checked_at');
        }
        if ($this->columnExists('inccom_transaction', 'receipt_json')) {
            $this->addSql('ALTER TABLE inccom_transaction DROP receipt_json');
        }
        if ($this->tableExists('inccom_user_fns_credential')) {
            $this->addSql('ALTER TABLE inccom_user_fns_credential DROP FOREIGN KEY FK_inccom_user_fns_credential_user');
            $this->addSql('DROP TABLE inccom_user_fns_credential');
        }
    }

    private function tableExists(string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
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

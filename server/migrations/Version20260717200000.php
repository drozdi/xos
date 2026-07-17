<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260717200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IncCom module: accounts, transactions, transfers, items, categories';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE inccom_account (id INT AUTO_INCREMENT NOT NULL, owner_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, sort INT DEFAULT 100 NOT NULL, label VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, currency VARCHAR(3) DEFAULT \'RUB\' NOT NULL, number VARCHAR(255) DEFAULT NULL, created_at DATETIME DEFAULT NULL, balance NUMERIC(16, 2) DEFAULT \'0.00\' NOT NULL, type VARCHAR(255) NOT NULL, icon VARCHAR(255) NOT NULL, color VARCHAR(255) NOT NULL, INDEX IDX_7043C03F7E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_account_user (account_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_D8692D6C9B6B5FBA (account_id), INDEX IDX_D8692D6CA76ED395 (user_id), PRIMARY KEY(account_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_category (id INT AUTO_INCREMENT NOT NULL, account_id INT DEFAULT NULL, owner_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, sort INT DEFAULT 100 NOT NULL, label VARCHAR(255) NOT NULL, created_at DATETIME DEFAULT NULL, type VARCHAR(255) NOT NULL, INDEX IDX_619C269B9B6B5FBA (account_id), INDEX IDX_619C269B7E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_product (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, label VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, unit VARCHAR(50) DEFAULT NULL, created_at DATETIME DEFAULT NULL, INDEX IDX_DE3F9236A76ED395 (user_id), UNIQUE INDEX uniq_item_user_name (user_id, label), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_item_item_category (item_id INT NOT NULL, item_category_id INT NOT NULL, INDEX IDX_915F6424126F525E (item_id), INDEX IDX_915F6424F22EC5D4 (item_category_id), PRIMARY KEY(item_id, item_category_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_product_tag (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, product_id INT DEFAULT NULL, tag_id INT DEFAULT NULL, INDEX IDX_5C80B075A76ED395 (user_id), INDEX IDX_5C80B0754584665A (product_id), INDEX IDX_5C80B075BAD26311 (tag_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_tag (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, owner_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, label VARCHAR(255) NOT NULL, keywords LONGTEXT DEFAULT NULL, created_at DATETIME DEFAULT NULL, INDEX IDX_494593CC727ACA70 (parent_id), INDEX IDX_494593CC7E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_transaction (id INT AUTO_INCREMENT NOT NULL, account_id INT DEFAULT NULL, category_id INT DEFAULT NULL, owner_id INT DEFAULT NULL, transfer_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, type VARCHAR(255) NOT NULL, date DATETIME NOT NULL, amount NUMERIC(16, 2) DEFAULT \'0.00\' NOT NULL, comment LONGTEXT DEFAULT NULL, mcc VARCHAR(10) DEFAULT NULL, fn VARCHAR(20) DEFAULT NULL, fpd VARCHAR(20) DEFAULT NULL, fp VARCHAR(20) DEFAULT NULL, fd VARCHAR(20) DEFAULT NULL, is_manual_amount TINYINT(1) DEFAULT 0 NOT NULL, created_at DATETIME DEFAULT NULL, INDEX IDX_CD1156389B6B5FBA (account_id), INDEX IDX_CD11563812469DE2 (category_id), INDEX IDX_CD1156387E3C61F9 (owner_id), INDEX IDX_CD115638537048AF (transfer_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_transaction_item (id INT AUTO_INCREMENT NOT NULL, transaction_id INT NOT NULL, item_id INT NOT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, quantity NUMERIC(12, 3) NOT NULL, price NUMERIC(16, 2) NOT NULL, sum NUMERIC(16, 2) NOT NULL, created_at DATETIME DEFAULT NULL, INDEX IDX_5EB996782FC0CB0F (transaction_id), INDEX IDX_5EB99678126F525E (item_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inccom_transfer (id INT AUTO_INCREMENT NOT NULL, from_account_id INT NOT NULL, to_account_id INT NOT NULL, author_id INT DEFAULT NULL, outgoing_transaction_id INT DEFAULT NULL, incoming_transaction_id INT DEFAULT NULL, x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, amount NUMERIC(16, 2) NOT NULL, date DATETIME NOT NULL, comment LONGTEXT DEFAULT NULL, created_at DATETIME DEFAULT NULL, INDEX IDX_27E49C9AB0CF99BD (from_account_id), INDEX IDX_27E49C9ABC58BDC7 (to_account_id), INDEX IDX_27E49C9AF675F31B (author_id), UNIQUE INDEX UNIQ_27E49C9AB29C5D53 (outgoing_transaction_id), UNIQUE INDEX UNIQ_27E49C9ABDF6AADF (incoming_transaction_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE inccom_account ADD CONSTRAINT FK_7043C03F7E3C61F9 FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_account_user ADD CONSTRAINT FK_D8692D6C9B6B5FBA FOREIGN KEY (account_id) REFERENCES inccom_account (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_account_user ADD CONSTRAINT FK_D8692D6CA76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_category ADD CONSTRAINT FK_619C269B9B6B5FBA FOREIGN KEY (account_id) REFERENCES inccom_account (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_category ADD CONSTRAINT FK_619C269B7E3C61F9 FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_product ADD CONSTRAINT FK_DE3F9236A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_item_item_category ADD CONSTRAINT FK_915F6424126F525E FOREIGN KEY (item_id) REFERENCES inccom_product (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_item_item_category ADD CONSTRAINT FK_915F6424F22EC5D4 FOREIGN KEY (item_category_id) REFERENCES inccom_tag (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_product_tag ADD CONSTRAINT FK_5C80B075A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_product_tag ADD CONSTRAINT FK_5C80B0754584665A FOREIGN KEY (product_id) REFERENCES inccom_product (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_product_tag ADD CONSTRAINT FK_5C80B075BAD26311 FOREIGN KEY (tag_id) REFERENCES inccom_tag (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_tag ADD CONSTRAINT FK_494593CC727ACA70 FOREIGN KEY (parent_id) REFERENCES inccom_tag (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_tag ADD CONSTRAINT FK_494593CC7E3C61F9 FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_transaction ADD CONSTRAINT FK_CD1156389B6B5FBA FOREIGN KEY (account_id) REFERENCES inccom_account (id)');
        $this->addSql('ALTER TABLE inccom_transaction ADD CONSTRAINT FK_CD11563812469DE2 FOREIGN KEY (category_id) REFERENCES inccom_category (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_transaction ADD CONSTRAINT FK_CD1156387E3C61F9 FOREIGN KEY (owner_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_transaction ADD CONSTRAINT FK_CD115638537048AF FOREIGN KEY (transfer_id) REFERENCES inccom_transfer (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_transaction_item ADD CONSTRAINT FK_5EB996782FC0CB0F FOREIGN KEY (transaction_id) REFERENCES inccom_transaction (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inccom_transaction_item ADD CONSTRAINT FK_5EB99678126F525E FOREIGN KEY (item_id) REFERENCES inccom_product (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE inccom_transfer ADD CONSTRAINT FK_27E49C9AB0CF99BD FOREIGN KEY (from_account_id) REFERENCES inccom_account (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE inccom_transfer ADD CONSTRAINT FK_27E49C9ABC58BDC7 FOREIGN KEY (to_account_id) REFERENCES inccom_account (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE inccom_transfer ADD CONSTRAINT FK_27E49C9AF675F31B FOREIGN KEY (author_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_transfer ADD CONSTRAINT FK_27E49C9AB29C5D53 FOREIGN KEY (outgoing_transaction_id) REFERENCES inccom_transaction (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inccom_transfer ADD CONSTRAINT FK_27E49C9ABDF6AADF FOREIGN KEY (incoming_transaction_id) REFERENCES inccom_transaction (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE inccom_account DROP FOREIGN KEY FK_7043C03F7E3C61F9');
        $this->addSql('ALTER TABLE inccom_account_user DROP FOREIGN KEY FK_D8692D6C9B6B5FBA');
        $this->addSql('ALTER TABLE inccom_account_user DROP FOREIGN KEY FK_D8692D6CA76ED395');
        $this->addSql('ALTER TABLE inccom_category DROP FOREIGN KEY FK_619C269B9B6B5FBA');
        $this->addSql('ALTER TABLE inccom_category DROP FOREIGN KEY FK_619C269B7E3C61F9');
        $this->addSql('ALTER TABLE inccom_product DROP FOREIGN KEY FK_DE3F9236A76ED395');
        $this->addSql('ALTER TABLE inccom_item_item_category DROP FOREIGN KEY FK_915F6424126F525E');
        $this->addSql('ALTER TABLE inccom_item_item_category DROP FOREIGN KEY FK_915F6424F22EC5D4');
        $this->addSql('ALTER TABLE inccom_product_tag DROP FOREIGN KEY FK_5C80B075A76ED395');
        $this->addSql('ALTER TABLE inccom_product_tag DROP FOREIGN KEY FK_5C80B0754584665A');
        $this->addSql('ALTER TABLE inccom_product_tag DROP FOREIGN KEY FK_5C80B075BAD26311');
        $this->addSql('ALTER TABLE inccom_tag DROP FOREIGN KEY FK_494593CC727ACA70');
        $this->addSql('ALTER TABLE inccom_tag DROP FOREIGN KEY FK_494593CC7E3C61F9');
        $this->addSql('ALTER TABLE inccom_transaction DROP FOREIGN KEY FK_CD1156389B6B5FBA');
        $this->addSql('ALTER TABLE inccom_transaction DROP FOREIGN KEY FK_CD11563812469DE2');
        $this->addSql('ALTER TABLE inccom_transaction DROP FOREIGN KEY FK_CD1156387E3C61F9');
        $this->addSql('ALTER TABLE inccom_transaction DROP FOREIGN KEY FK_CD115638537048AF');
        $this->addSql('ALTER TABLE inccom_transaction_item DROP FOREIGN KEY FK_5EB996782FC0CB0F');
        $this->addSql('ALTER TABLE inccom_transaction_item DROP FOREIGN KEY FK_5EB99678126F525E');
        $this->addSql('ALTER TABLE inccom_transfer DROP FOREIGN KEY FK_27E49C9AB0CF99BD');
        $this->addSql('ALTER TABLE inccom_transfer DROP FOREIGN KEY FK_27E49C9ABC58BDC7');
        $this->addSql('ALTER TABLE inccom_transfer DROP FOREIGN KEY FK_27E49C9AF675F31B');
        $this->addSql('ALTER TABLE inccom_transfer DROP FOREIGN KEY FK_27E49C9AB29C5D53');
        $this->addSql('ALTER TABLE inccom_transfer DROP FOREIGN KEY FK_27E49C9ABDF6AADF');
        $this->addSql('DROP TABLE inccom_account');
        $this->addSql('DROP TABLE inccom_account_user');
        $this->addSql('DROP TABLE inccom_category');
        $this->addSql('DROP TABLE inccom_product');
        $this->addSql('DROP TABLE inccom_item_item_category');
        $this->addSql('DROP TABLE inccom_product_tag');
        $this->addSql('DROP TABLE inccom_tag');
        $this->addSql('DROP TABLE inccom_transaction');
        $this->addSql('DROP TABLE inccom_transaction_item');
        $this->addSql('DROP TABLE inccom_transfer');
    }
}

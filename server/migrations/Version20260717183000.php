<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260717183000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create SchoolTask tables: st_ep_subject, st_group_meta, st_ep_event and join tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE st_ep_subject (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, sort INT DEFAULT 100 NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE ep_subject_user (subject_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_8F9E642823EDC87 (subject_id), INDEX IDX_8F9E6428A76ED395 (user_id), PRIMARY KEY(subject_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE st_group_meta (group_id INT NOT NULL, subject_id INT DEFAULT NULL, INDEX IDX_7E8D0F5FFE54D947 (group_id), INDEX IDX_7E8D0F5F23EDC87 (subject_id), PRIMARY KEY(group_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE st_ep_event (id INT AUTO_INCREMENT NOT NULL, parent_id INT DEFAULT NULL, user_id INT DEFAULT NULL, group_id INT DEFAULT NULL, class_id INT DEFAULT NULL, x_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, title VARCHAR(255) DEFAULT NULL, start DATETIME NOT NULL, end DATETIME NOT NULL, theme LONGTEXT DEFAULT NULL, net_resource LONGTEXT DEFAULT NULL, pt LONGTEXT DEFAULT NULL, ht LONGTEXT DEFAULT NULL, description LONGTEXT DEFAULT NULL, zoom_link LONGTEXT DEFAULT NULL, zoom_in LONGTEXT DEFAULT NULL, zoom_pas LONGTEXT DEFAULT NULL, `update` TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_6E0BABA2727ACA70 (parent_id), INDEX IDX_6E0BABA2A76ED395 (user_id), INDEX IDX_6E0BABA2FE54D947 (group_id), INDEX IDX_6E0BABA2EA000B10 (class_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE ep_event_file (event_id INT NOT NULL, file_id INT NOT NULL, INDEX IDX_9E2A077071F7E88B (event_id), INDEX IDX_9E2A077093CB796C (file_id), PRIMARY KEY(event_id, file_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql('ALTER TABLE ep_subject_user ADD CONSTRAINT FK_8F9E642823EDC87 FOREIGN KEY (subject_id) REFERENCES st_ep_subject (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ep_subject_user ADD CONSTRAINT FK_8F9E6428A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE st_group_meta ADD CONSTRAINT FK_7E8D0F5FFE54D947 FOREIGN KEY (group_id) REFERENCES main_group (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE st_group_meta ADD CONSTRAINT FK_7E8D0F5F23EDC87 FOREIGN KEY (subject_id) REFERENCES st_ep_subject (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_6E0BABA2727ACA70 FOREIGN KEY (parent_id) REFERENCES st_ep_event (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_6E0BABA2A76ED395 FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_6E0BABA2FE54D947 FOREIGN KEY (group_id) REFERENCES main_group (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_6E0BABA2EA000B10 FOREIGN KEY (class_id) REFERENCES main_group (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE ep_event_file ADD CONSTRAINT FK_9E2A077071F7E88B FOREIGN KEY (event_id) REFERENCES st_ep_event (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ep_event_file ADD CONSTRAINT FK_9E2A077093CB796C FOREIGN KEY (file_id) REFERENCES main_file (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ep_event_file DROP FOREIGN KEY FK_9E2A077071F7E88B');
        $this->addSql('ALTER TABLE ep_event_file DROP FOREIGN KEY FK_9E2A077093CB796C');
        $this->addSql('ALTER TABLE st_ep_event DROP FOREIGN KEY FK_6E0BABA2727ACA70');
        $this->addSql('ALTER TABLE st_ep_event DROP FOREIGN KEY FK_6E0BABA2A76ED395');
        $this->addSql('ALTER TABLE st_ep_event DROP FOREIGN KEY FK_6E0BABA2FE54D947');
        $this->addSql('ALTER TABLE st_ep_event DROP FOREIGN KEY FK_6E0BABA2EA000B10');
        $this->addSql('ALTER TABLE st_group_meta DROP FOREIGN KEY FK_7E8D0F5FFE54D947');
        $this->addSql('ALTER TABLE st_group_meta DROP FOREIGN KEY FK_7E8D0F5F23EDC87');
        $this->addSql('ALTER TABLE ep_subject_user DROP FOREIGN KEY FK_8F9E642823EDC87');
        $this->addSql('ALTER TABLE ep_subject_user DROP FOREIGN KEY FK_8F9E6428A76ED395');
        $this->addSql('DROP TABLE ep_event_file');
        $this->addSql('DROP TABLE st_ep_event');
        $this->addSql('DROP TABLE st_group_meta');
        $this->addSql('DROP TABLE ep_subject_user');
        $this->addSql('DROP TABLE st_ep_subject');
    }
}

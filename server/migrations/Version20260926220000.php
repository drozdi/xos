<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'SchoolTask parent share on class (st_ep_group_share)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE st_ep_group_share (
            id INT AUTO_INCREMENT NOT NULL,
            group_id INT NOT NULL,
            user_id INT NOT NULL,
            role VARCHAR(32) DEFAULT \'parent\' NOT NULL,
            invited_by_id INT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            UNIQUE INDEX uniq_st_ep_group_share_user (group_id, user_id),
            INDEX IDX_ST_EP_GROUP_SHARE_GROUP (group_id),
            INDEX IDX_ST_EP_GROUP_SHARE_USER (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE st_ep_group_share ADD CONSTRAINT FK_ST_EP_GROUP_SHARE_GROUP FOREIGN KEY (group_id) REFERENCES st_ep_group (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE st_ep_group_share ADD CONSTRAINT FK_ST_EP_GROUP_SHARE_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE st_ep_group_share ADD CONSTRAINT FK_ST_EP_GROUP_SHARE_INVITER FOREIGN KEY (invited_by_id) REFERENCES main_user (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE st_ep_group_share DROP FOREIGN KEY FK_ST_EP_GROUP_SHARE_GROUP');
        $this->addSql('ALTER TABLE st_ep_group_share DROP FOREIGN KEY FK_ST_EP_GROUP_SHARE_USER');
        $this->addSql('ALTER TABLE st_ep_group_share DROP FOREIGN KEY FK_ST_EP_GROUP_SHARE_INVITER');
        $this->addSql('DROP TABLE st_ep_group_share');
    }
}

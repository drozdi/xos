<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Claimant access_options: drop DB DEFAULT; board_board: add column DEFAULTs.
 */
final class Version20260817140336 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Claimant access_options default + board_board column defaults';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE main_claimant CHANGE access_options access_options JSON NOT NULL');
        $this->addSql("ALTER TABLE board_board MODIFY background_type VARCHAR(16) DEFAULT 'color' NOT NULL");
        $this->addSql("ALTER TABLE board_board MODIFY background_value VARCHAR(512) DEFAULT '#0079bf' NOT NULL");
        $this->addSql("ALTER TABLE board_board MODIFY visibility VARCHAR(16) DEFAULT 'private' NOT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE board_board MODIFY visibility VARCHAR(16) NOT NULL");
        $this->addSql("ALTER TABLE board_board MODIFY background_value VARCHAR(512) NOT NULL");
        $this->addSql("ALTER TABLE board_board MODIFY background_type VARCHAR(16) NOT NULL");
        $this->addSql("ALTER TABLE main_claimant CHANGE access_options access_options JSON NOT NULL DEFAULT ('{}')");
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260722145100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'SchoolTask: standalone st_group hierarchy instead of main_group + st_group_meta';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE st_group (
                id INT AUTO_INCREMENT NOT NULL,
                parent_id INT DEFAULT NULL,
                user_id INT DEFAULT NULL,
                subject_id INT DEFAULT NULL,
                x_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                sort INT DEFAULT 100 NOT NULL,
                level INT DEFAULT 0 NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(191) NOT NULL,
                description LONGTEXT DEFAULT NULL,
                graduated TINYINT(1) DEFAULT 0 NOT NULL,
                graduated_year SMALLINT DEFAULT NULL,
                UNIQUE INDEX UNIQ_ST_GROUP_CODE (code),
                INDEX IDX_ST_GROUP_PARENT (parent_id),
                INDEX IDX_ST_GROUP_USER (user_id),
                INDEX IDX_ST_GROUP_SUBJECT (subject_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql(<<<'SQL'
            CREATE TABLE st_group_user (
                id INT AUTO_INCREMENT NOT NULL,
                group_id INT NOT NULL,
                user_id INT NOT NULL,
                UNIQUE INDEX UNIQ_ST_GROUP_USER_PAIR (group_id, user_id),
                INDEX IDX_ST_GROUP_USER_GROUP (group_id),
                INDEX IDX_ST_GROUP_USER_USER (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql('ALTER TABLE st_group ADD CONSTRAINT FK_ST_GROUP_PARENT FOREIGN KEY (parent_id) REFERENCES st_group (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE st_group ADD CONSTRAINT FK_ST_GROUP_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE st_group ADD CONSTRAINT FK_ST_GROUP_SUBJECT FOREIGN KEY (subject_id) REFERENCES st_ep_subject (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE st_group_user ADD CONSTRAINT FK_ST_GROUP_USER_GROUP FOREIGN KEY (group_id) REFERENCES st_group (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE st_group_user ADD CONSTRAINT FK_ST_GROUP_USER_USER FOREIGN KEY (user_id) REFERENCES main_user (id) ON DELETE CASCADE');

        if ($schema->hasTable('st_group_meta')) {
            $this->addSql(<<<'SQL'
                INSERT INTO st_group (id, parent_id, user_id, subject_id, sort, level, name, code, graduated, graduated_year)
                SELECT
                    g.id,
                    g.parent_id,
                    g.user_id,
                    m.subject_id,
                    g.sort,
                    g.level,
                    g.name,
                    g.code,
                    COALESCE(m.graduated, 0),
                    m.graduated_year
                FROM main_group g
                LEFT JOIN st_group_meta m ON m.group_id = g.id
                WHERE g.code LIKE 'class\_%' OR g.code LIKE 'st\_%'
            SQL);

            $this->addSql(<<<'SQL'
                INSERT INTO st_group_user (group_id, user_id)
                SELECT mug.group_id, mug.user_id
                FROM main_user_group mug
                INNER JOIN st_group sg ON sg.id = mug.group_id
            SQL);

            $this->addSql('DROP TABLE st_group_meta');
        }

        if ($schema->hasTable('st_ep_event')) {
            foreach ($schema->getTable('st_ep_event')->getForeignKeys() as $foreignKey) {
                if (in_array('class_id', $foreignKey->getLocalColumns(), true)
                    || in_array('group_id', $foreignKey->getLocalColumns(), true)) {
                    $this->addSql(sprintf(
                        'ALTER TABLE st_ep_event DROP FOREIGN KEY %s',
                        $foreignKey->getName()
                    ));
                }
            }
            $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_ST_EP_EVENT_CLASS FOREIGN KEY (class_id) REFERENCES st_group (id) ON DELETE RESTRICT');
            $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_ST_EP_EVENT_GROUP FOREIGN KEY (group_id) REFERENCES st_group (id) ON DELETE RESTRICT');
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE st_ep_event DROP FOREIGN KEY FK_ST_EP_EVENT_CLASS');
        $this->addSql('ALTER TABLE st_ep_event DROP FOREIGN KEY FK_ST_EP_EVENT_GROUP');
        $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_ST_EP_EVENT_CLASS FOREIGN KEY (class_id) REFERENCES main_group (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE st_ep_event ADD CONSTRAINT FK_ST_EP_EVENT_GROUP FOREIGN KEY (group_id) REFERENCES main_group (id) ON DELETE RESTRICT');
        $this->addSql('DROP TABLE st_group_user');
        $this->addSql('DROP TABLE st_group');
    }
}

# Инфоблоки

Конструктор каталогов: тип, блок, раздел, свойство, элемент. Поверх типа `content` сделаны заметки, статьи, FAQ, галереи, рецепты, услуги, идеи, лиды, контакты.

Доступ: `ROLE_IBLOCK`. Рецепты дополнительно смотрят `ROLE_RECIPE`.

Список и карточка контента — общие компоненты `ContentCatalogListApp` и `ContentCatalogDetailApp`. Новый блок того же вида описывается конфигом. Заготовка: `php bin/console iblock:catalog-stub <code>`.

Код: `server/src/IBlock`, `client/src/apps/iblock-*`, `client/src/features/iblock-content`.

См. [TZ.md](TZ.md), [API.md](API.md).

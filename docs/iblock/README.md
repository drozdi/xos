# Инфоблоки и контент

Конструктор каталогов: тип, блок, раздел, свойство, значение списка, элемент. Поверх типа `content` сделаны готовые каталоги. Отдельного серверного модуля контента нет: те же `/api/iblock/*`.

Доступ: `ROLE_IBLOCK`. Рецепты дополнительно требуют `ROLE_RECIPE` (`server/src/Recipe/setting.json`, своих маршрутов нет).

Код: `server/src/IBlock`, `client/src/apps/iblock-*`, `client/src/features/iblock-content`.

## Конструктор

| ID | Экран |
|----|--------|
| iblock-types / iblock-type | Типы |
| iblock-blocks / iblock-block | Блоки |
| iblock-sections / iblock-section | Разделы |
| iblock-properties / iblock-property | Свойства |
| iblock-elements / iblock-element | Элементы |

## Каталоги типа `content`

Общие экраны `ContentCatalogListApp` и `ContentCatalogDetailApp`. Новый каталог описывается конфигом. Заготовка: `php bin/console iblock:catalog-stub <code>`.

| Блок | Список | Карточка | Разделы |
|------|--------|----------|---------|
| notes | notes | note | notebooks |
| articles | articles | article | — |
| faq | faqs | faq | — |
| gallery | galleries | gallery | — |
| events | announcements | announcement | — |
| contacts | contacts | contact | — |
| services | services | service | — |
| ideas | ideas | idea | — |
| leads | leads | lead | — |
| recipes | recipes | recipe | recipe-categories |

Коды блоков: `notes`, `articles`, `faq`, `gallery`, `events`, `contacts`, `services`, `ideas`, `leads`, `recipes`. Код типа: `content`.

Дополнительные поля каталогов: подпись галереи, дата и место события, должность, телефон и email контакта, цена услуги, статус и приоритет идеи, стадия, приоритет и контакт лида.

См. [TZ.md](TZ.md), [API.md](API.md).

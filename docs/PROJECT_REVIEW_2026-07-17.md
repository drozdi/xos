# Ревью проекта XOS

Дата: 2026-07-17  
Область: текущий репозиторий и незакоммиченная реализация SchoolTask. Код не менялся.

## Приоритетные замечания

### Critical

1. **Переписана уже существующая миграция**
   - Файлы: удалённая `server/migrations/Version20260717145721.php`, `server/migrations/Version20260717165527.php:20-24`.
   - Удалена миграция, а новая повторно создаёт базовую схему. В уже развёрнутой БД это приводит к отсутствующей записи в истории миграций либо ошибкам `table already exists`.
   - Предложение: восстановить применённую миграцию; оставить для SchoolTask только отдельную инкрементальную миграцию `Version20260717183000`.

2. **XSS в карточке урока**
   - Файлы: `client/src/features/schooltask/EventDetailModal.tsx:47,53`, `server/src/SchoolTask/Service/EventManager.php:213,215`.
   - `ht` и `pt` сохраняются без очистки, API возвращает исходный HTML, а клиент рендерит его через `dangerouslySetInnerHTML`.
   - Предложение: возвращать plain text и отображать переносы строк на клиенте; если HTML нужен, очищать его строгим allowlist-санитайзером на сервере и перед рендерингом.

3. **Файлы заданий доступны без авторизации**
   - Файлы: `server/config/packages/security.yaml:51`, `server/src/Main/Controller/FileServeController.php:17-28`, `server/src/SchoolTask/Service/EventManager.php:204-207`.
   - Маршрут `/uploads/` разрешён для `PUBLIC_ACCESS`; ссылка из карточки ученика открывает файл по URL без проверки прав.
   - Предложение: раздавать файлы заданий через авторизованный endpoint с проверкой доступа к событию либо использовать короткоживущие signed URLs.

4. **Нет проверки безопасного пути при загрузке и выдаче файлов**
   - Файлы: `server/src/Main/Controller/FileController.php:21-25`, `server/src/Main/Service/FileManager.php:41-44`, `server/src/Main/Controller/FileServeController.php:20`.
   - Входные `module`, `subDir` и имя файла конкатенируются с каталогом загрузок без нормализации и проверки, что итоговый путь остаётся внутри `upload_dir`.
   - Предложение: не принимать каталог от клиента; использовать whitelist модуля, безопасные сегменты и canonical-path проверку с префиксом `upload_dir`.

### High

4. **Инъекция через базовый репозиторий**
   - Файл: `server/src/AbstractRepository.php:16-25,29-34`.
   - Фильтры и ключи сортировки попадают в DQL строковой интерполяцией. Например, `subjects/list` передаёт фильтры из запроса в этот код.
   - Предложение: использовать `setParameter()` для значений, а поля фильтрации и сортировки ограничить whitelist в каждом репозитории.

5. **IDOR при получении editor-detail события**
   - Файл: `server/src/SchoolTask/Controller/EpEventController.php:270-289`.
   - После проверки доступа к классу из URL код загружает событие по `id`, но не сверяет его `class_id` с параметром маршрута. Пользователь, имеющий доступ к классу A, может запросить detail события класса B.
   - Предложение: после загрузки события вернуть 404, если `event->getClass()->getId() !== classId`, как уже сделано в `studentEventDetail`.

6. **Scope-пользователь проходит контроллер, но не может изменить событие**
   - Файлы: `server/src/SchoolTask/Controller/EpEventController.php:376-378`, `server/src/SchoolTask/Service/EventManager.php:45-52,78-82,100-104`.
   - `can_update.schooltask.event` допускает пользователя в editor endpoints, однако сервис разрешает create/edit/remove только тьютору класса.
   - Предложение: передавать результат авторизации в сервис либо централизовать правило: тьютор **или** соответствующий scope.

7. **Изменение серии перезаписывает даты всех вхождений**
   - Файл: `server/src/SchoolTask/Service/EventManager.php:84-93,253-289,335-360`.
   - Для `editType=all` и `after` `buildEvent` записывает присланные `start`/`end` каждому событию серии.
   - Предложение: при массовом редактировании не менять даты либо применять рассчитанное смещение к каждому экземпляру.

8. **Предмет сохраняет некорректных учителей**
   - Файлы: `client/src/apps/schooltask-subject/SchooltaskSubjectApp.tsx:84-87`, `server/src/SchoolTask/Service/SchoolTaskManager.php` (обработка `users`/`user_ids`).
   - Клиент отправляет одновременно `users` (массив объектов) и `user_ids`. Если сервис выбирает `users`, преобразование объектов в ID даёт некорректный результат.
   - Предложение: в `transformBeforeSave` исключать `users` из payload и отправлять только `user_ids`; на сервере принимать только один нормализованный контракт.

9. **Учитель не может сохранить задание из-за multipart-заголовка**
   - Файл: `client/src/core/api/endpoints/schooltaskApi.ts:298-316`.
   - Для `FormData` вручную установлен `Content-Type: multipart/form-data`; boundary должен добавлять Axios/browser. Без него сервер может не разобрать поля и файлы.
   - Предложение: удалить явный заголовок `Content-Type`.

10. **Клиентские права SchoolTask расходятся с API**
   - Файлы: `client/src/apps/schooltask-calendar/SchooltaskCalendarApp.tsx`, `client/src/apps/schooltask-calendar-editor/SchooltaskCalendarEditorApp.tsx`, `client/src/apps/schooltask-class/index.ts`.
   - API разрешает просмотр календаря участнику класса и редактирование тьютору, но UI ориентируется только на глобальный scope. Дополнительно редактор расписания не запускается из списка календарей.
   - Предложение: предоставить endpoint «мои классы/права» и строить доступность приложений по нему; добавить явный переход в editor для пользователей с правом редактирования.

11. **При изменении списка учеников теряются ID существующих связей**
   - Файл: `client/src/apps/schooltask-class/SchooltaskClassApp.tsx:183-190`.
   - Обработчик MultiSelect назначает каждой связи `id: index + 1` вместо ID, полученного с сервера. Это может обновить или удалить неверные `UserGroup`-связи.
   - Предложение: сопоставлять выбранный `user_id` с существующей связью и сохранять её ID; для новой связи передавать `id: 0`.

### Medium

12. **Целостность события не проверяется**
   - Файл: `server/src/SchoolTask/Service/EventManager.php:253-268`.
   - `group_id` может относиться к другому классу, чем `class_id`, поэтому можно создать несогласованную запись события.
   - Предложение: до сохранения проверить, что группа — дочерняя для класса и имеет назначенный предмет.

12. **Удаление класса или подгруппы может нарушить FK**
   - Файлы: `server/src/SchoolTask/Service/SchoolTaskManager.php`, `server/migrations/Version20260717183000.php`.
   - Связи событий с классом/группой ограничены внешними ключами; удаление сущностей при существующих событиях завершится ошибкой БД.
   - Предложение: заранее удалить/архивировать связанные события и файлы либо определить осознанную стратегию `ON DELETE`.

13. **Пагинация предметов теряет записи после первой страницы**
   - Файлы: `client/src/core/api/endpoints/schooltaskApi.ts:14-29`, `client/src/apps/schooltask-subjects/SchooltaskSubjectsApp.tsx`.
   - API не возвращает `Content-Range`, поэтому клиент считает `items.length` общим количеством. При лимите 50 дальнейшие страницы недоступны.
   - Предложение: серверу возвращать корректный `Content-Range`/total или отключить server-side pagination для этого списка.

## Проверки

- `client/npm run test`: успешно, 30 файлов и 167 тестов.
- `client/npm run build`: не проходит. TypeScript не находит `@testing-library/*` и `@storybook/react-vite`; есть ошибки типов в `components/table`.
- `client/npm run lint`: не проходит, 64 errors и 2 warnings. В новой функциональности есть `WeekCalendar.tsx:140` (неиспользуемый `weekEnd`); большинство остальных ошибок — legacy-код.
- `server/bin/phpunit`: не запускался, поскольку PHP отсутствует в `PATH`.
- `git diff --check`: ошибок пробелов не найдено.

## Рекомендуемый порядок

1. Закрыть XSS, публичную выдачу файлов, обход пути, injection и IDOR.
2. Исправить контракт авторизации и сохранение SchoolTask.
3. Восстановить зелёные build/lint и добавить проверки в CI.
4. Добавить integration/e2e тесты на роли, изоляцию классов, серию событий и загрузку файлов.

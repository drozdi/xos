# Руководство разработчика: приложения в `apps/`

> Как добавить новое бизнес-приложение в десктоп XOS.

## UI-стек

- **Ant Design** (`antd`, `@ant-design/icons`) — компоненты, формы, модалки, таблицы.
- Списки сущностей: `@/ui/data-table` / `@/components/table` (`DataTable` на antd `Table`).
- Тосты: `@/ui/toast` (`notifications.show`).
- Тема: `ThemeProvider` + `AntdProvider` (`docs/MANTINE_TO_ANTD.md`, отчёты в `docs/migration-reports/`).
- **Не** добавлять `@mantine/*` (eslint `no-restricted-imports`).

## Обзор

Каждое приложение — изолированный модуль в `client/src/apps/<app-id>/`. Регистрация автоматическая: `registerApps.ts` подхватывает все `index.ts` через `import.meta.glob`. Ручное добавление в реестр не требуется.

```
client/src/apps/
├── demo-calculator/     # пример без API
├── users/               # пример с API + role gate
├── settings/
└── my-app/              # ваше приложение
    ├── index.ts         # манифест (обязательно)
    ├── MyApp.tsx        # корневой компонент
    ├── MyIcon.tsx       # иконка (опционально)
    └── services/        # API-обёртки (опционально)
```

## Манифест (`index.ts`)

Файл экспортирует `AppManifest` как `default`:

```typescript
import { lazy } from 'react';
import type { AppManifest } from '@/core/appManager/types';
import { MyIcon } from './MyIcon';

const MyApp = lazy(() => import('./MyApp'));

const manifest: AppManifest = {
  id: 'my-app',              // уникальный ID, используется в windowId
  name: 'My App',            // заголовок в Start Menu
  version: '1.0.0',
  icon: MyIcon,              // React-компонент или URL строки
  component: MyApp,          // lazy-компонент окна
  defaultSize: { width: 640, height: 480 },
  minSize: { width: 400, height: 300 },   // опционально
  wmGroup: 'tools',          // группа на панели задач
  singleInstance: true,      // один экземпляр — фокус существующего
  requiredRole: 'admin',     // опционально: ROLE_* или короткое имя
  requiredScope: 'users',    // опционально: scope из accesses
  instanceKey: 'default',      // опционально: ключ экземпляра
};

export default manifest;
```

### Поля `AppManifest`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор. Формирует `windowId`: `{id}__{instanceKey}` |
| `name` | `string` | Отображаемое имя в Start Menu и заголовке окна по умолчанию |
| `version` | `string` | Версия приложения |
| `icon` | `ComponentType \| string` | Иконка в меню (компонент с `size?` или URL) |
| `component` | `LazyExoticComponent` | Корневой React-компонент, загружается lazy |
| `defaultSize` | `{ width, height }` | Размер окна при первом открытии |
| `minSize` | `{ width, height }` | Минимальный размер (react-rnd) |
| `wmGroup` | `string` | Группа на панели задач (`tools`, `admin`, `system`, …) |
| `singleInstance` | `boolean` | При повторном launch — фокус и restore существующего окна |
| `requiredRole` | `string` | Доступ только при наличии роли (`admin` → `ROLE_ADMIN`) |
| `requiredScope` | `string` | Доступ только при наличии scope у пользователя |
| `instanceKey` | `string \| fn` | Ключ экземпляра; по умолчанию `'default'` |

## Пример: `demo-calculator`

Минимальное приложение без API:

```typescript
// client/src/apps/demo-calculator/index.ts
const manifest: AppManifest = {
  id: 'demo-calculator',
  name: 'Calculator',
  version: '1.0.0',
  icon: CalculatorIcon,
  component: lazy(() => import('./CalculatorApp')),
  defaultSize: { width: 320, height: 480 },
  minSize: { width: 280, height: 400 },
  wmGroup: 'tools',
  singleInstance: true,
};
```

Компонент использует `useCoreApi()` для заголовка окна:

```typescript
const coreApi = useCoreApi();
useEffect(() => {
  const user = coreApi.auth.getUser();
  coreApi.window.setTitle(`Calculator — ${user?.alias ?? user?.login ?? 'Guest'}`);
}, [coreApi]);
```

## Корневой компонент

- Экспорт `default` — функциональный компонент.
- Оборачивается в `CoreApiContext` и `AppContext` при открытии окна.
- Используйте Mantine + Tailwind по стилю существующих apps.
- Для HTTP-запросов предпочтительно TanStack Query + endpoints из `core/api/endpoints/`.

### Слой `services/`

Тонкие обёртки над API (пример `users/services/usersApi.ts`):

```typescript
import { listUsers } from '@/core/api/endpoints/main';

export async function fetchUsersList(request = {}) {
  return listUsers(request);
}
```

## `useCoreApi()`

Хук доступен внутри любого компонента приложения. Возвращает `CoreApi` — единую точку доступа к инфраструктуре:

```typescript
import { useCoreApi } from '@/core/hooks/useCoreApi';

function MyApp() {
  const api = useCoreApi();

  // HTTP (Axios с Bearer и refresh)
  const { data } = await api.http.get('/api/...');

  // Уведомления
  api.toast.success('Сохранено');
  api.toast.error('Ошибка сети');

  // Окно
  api.window.setTitle('Новый заголовок');
  api.window.minimize();
  api.window.onClose(async () => {
    if (!confirm('Закрыть?')) return false; // отмена закрытия
  });

  // Текущий пользователь
  const user = api.auth.getUser();

  // Роли
  api.roles.isAdmin();
  api.roles.isRole('admin');

  // Scopes
  api.scopes.checkHasScope('users');
  api.scopes.getLevelScope('users');

  // Настройки (SettingManager)
  await api.settings.get('USER', 'my-key');
  await api.settings.set('USER', 'my-key', { foo: 'bar' });
}
```

### Настройки в приложении

Для реактивного UI используйте хуки из `core/settings/hooks.ts`:

```typescript
import { useSetting, useSetState } from '@/core/settings/hooks';

const [theme, setTheme] = useSetting('USER', 'theme', 'light');
```

Категории: `CONFIG`, `USER`, `WIN`, `APP` (см. `ISettingAdapter`).

## Хранилища данных пользователя

> Полный контракт границ: [`docs/ADR-user-app-data.md`](ADR-user-app-data.md).

Четыре разных места — **не** смешивать:

| Хранилище | API / helper | Когда использовать |
|-----------|--------------|-------------------|
| **`user_settings`** | `/api/settings` · `api.settings` / `core/settings` | Desktop shell: layout (`USER`), window geometry (`WIN`), launch history / shell chrome (`APP`), defaults (`HKEY_CONFIG` / `CONFIG`) |
| **`user_app_data`** | `/api/user-data` · `userData.ts` | Opaque prefs модуля, drafts, app-local UI state (фильтры, черновики форм) |
| **Доменные entity** | `/api/{module}/…` | Данные с бизнес-смыслом, связями, claimant scopes, списками/поиском |
| **`User.options`** | `/api/account/options` | **Только legacy** профильный blob аккаунта |

### Правило выбора

1. Позиция/размер окна → `user_settings` **WIN** (Window Manager делает сам).
2. Layout / панели desktop → `user_settings` **USER**.
3. Launch history / shell chrome → `user_settings` **APP**.
4. Бизнес-сущность с правами → доменный API модуля.
5. Остальное opaque per-user app payload → **`user_app_data`**.
6. **Новые prefs / ключи приложений в `User.options` — запрещены.** Не расширять legacy blob.

### Namespace `code` в `user_app_data`

Формат: `{appNs}.{key…}` (минимум один сегмент после `appNs`). Charset: `^[a-z0-9._-]+$`, max 191.

Примеры:

| code | Назначение |
|------|------------|
| `todo.ui.filters` | UI-фильтры модуля todo |
| `inccom.draft.compose` | Черновик формы IncCom |

Не дублировать категории settings (`USER`/`WIN`/…) внутри `code`. Не класть secrets в `value`.

### Клиентский helper

Используйте **`client/src/core/api/endpoints/userData.ts`** (list / get / upsert / delete, Zod).  
**Не** встраивать app prefs в `SettingManager` и категории `USER`|`APP`|`WIN`. Query keys: `['userData', …]`.

```typescript
import { list, upsert, userDataApi } from '@/core/api/endpoints/userData';

const items = await list('todo.');
await upsert({ code: 'todo.ui.filters', value: { status: 'open' } });
// или: await userDataApi.delete('todo.ui.filters');
```

PUT всегда **full replace** `value` (merge на клиенте, если нужен частичный апдейт).

## Регистрация через `import.meta.glob`

Файл `core/appManager/registerApps.ts` сканирует все манифесты:

```typescript
const modules = import.meta.glob('../../apps/*/index.ts', { eager: true });
```

**Достаточно создать папку** `client/src/apps/<id>/index.ts` с `export default manifest` — приложение появится в Start Menu после перезагрузки dev-сервера.

Вызов `registerAllApps()` выполняется при старте Desktop.

## Авто-сохранение окон (WIN settings)

Состояние окон сохраняется в категории `WIN` с debounce 300 ms:

- Ключ: `{appId}/{windowId}` (например `demo-calculator/demo-calculator__default`)
- Сохраняется: позиция, размер, minimized/maximized, wmGroup, wmSort, title
- При `launchApp` окно восстанавливается из WIN, если настройки инициализированы
- При закрытии — запись удаляется из WIN

Приложению **не нужно** вручную сохранять геометрию окна — это делает Window Manager.

## Role / Scope gating

### На уровне манифеста

```typescript
// apps/users/index.ts
requiredRole: 'admin',   // только ROLE_ADMIN
```

При launch без прав — toast «Access denied», окно не открывается.

### Фильтрация в Start Menu

`AppRegistry.getAvailable()` скрывает приложения, недоступные текущему пользователю (те же проверки `requiredRole` / `requiredScope`).

### Внутри компонента

```typescript
const api = useCoreApi();

if (!api.roles.isAdmin()) {
  return <Text>Недостаточно прав</Text>;
}

if (!api.scopes.checkHasScope('users.write')) {
  return <Text>Нет scope users.write</Text>;
}
```

Роли нормализуются: `'admin'` → `'ROLE_ADMIN'`. Scopes приходят с сервера при логине (`/api/account/accesses`).

## Запуск приложения программно

```typescript
import { useAppManager } from '@/core/appManager';

const windowId = await useAppManager.getState().launchApp('my-app', {
  title: 'Кастомный заголовок',
  instanceKey: 'report-1',
  props: { reportId: 42 },
  skipHistory: false,
});
```

## Чеклист нового приложения

1. Создать `client/src/apps/<id>/index.ts` с манифестом
2. Создать lazy-компонент `<id>App.tsx`
3. При необходимости — `services/` и endpoints в `core/api/endpoints/`
4. Указать `wmGroup`, `singleInstance`, role/scope если нужен контроль доступа
5. Использовать `useCoreApi()` вместо прямых импортов axios/store
6. Проверить в Start Menu и панели задач

## Claimants и `can_*` (права модулей)

Контракт и ADR: [ARCHITECTURE.md](ARCHITECTURE.md) — «ADR: каталог прав `setting.json` → `main_claimant.access_options`».  
Схема БД: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). API: [API_SPEC.md](API_SPEC.md).

### Источник истины и риск рассинхрона

| Потребитель | Источник |
|-------------|----------|
| Runtime auth (`UserScopeResolver`, `getCanScopeValue`) | файлы `server/src/*/setting.json` |
| Main Admin UI (вкладки User/Group Access) | БД `main_claimant.access_options` **после** sync |

После правки `setting.json` без `main:claimant:sync` auth уже видит новые биты, а UI — старые/пустые options (или наоборот). Sync обязателен перед проверкой Admin UI и в deploy.

### Как добавить claimant / `can_*`

1. Открыть модульный `server/src/<Module>/setting.json`.
2. В `claimant` добавить код → отображаемое имя.
3. В `map-access` описать права для узла (см. привязку ниже).
4. Запустить sync (см. ниже).
5. Проверить вкладки доступов в Main Admin: чекбоксы берутся из `GET /api/main/claimant/app-access-modules` (`access_options`).

Пример (фрагмент):

```json
{
  "claimant": {
    "device.device": "Устройства: Устройства"
  },
  "map-access": {
    "can_write_off": { "bit": 16, "title": "Списание" },
    "device": {
      "can_create": 1,
      "can_read": { "bit": 2, "title": "Чтение" }
    }
  }
}
```

**Привязка кода claimant → узел `map-access`** (как as-is):

| Claimant `code` | Узел |
|-----------------|------|
| `device` (один сегмент = module) | корневые `can_*` модуля |
| `device.device` | `map-access.device` |
| `device.software.type` | `map-access.software.type` (nested) |

### Формат leaf `can_*`

Допустимы оба варианта; sync в БД всегда нормализует к object `{ bit, title[, description] }`:

1. Legacy number: `"can_read": 2`
2. Object: `"can_read": { "bit": 2, "title": "Чтение", "description": "опционально" }`

Если `title` нет — sync подставляет default (таблица в ADR). `bit` должен быть int > 0.

**Смена bit** у уже известного `can_*` в БД: sync **abort** с ненулевым exit, пока не передать `--force`. `--force` перезаписывает `access_options`; уровни в `*_access.level` **не** мигрирует.

### Sync CLI

```bash
cd server
php bin/console main:claimant:sync              # запись в БД
php bin/console main:claimant:sync --dry-run    # validate + отчёт, без записи
php bin/console main:claimant:sync --force      # разрешить overwrite при смене bit
```

Stdout (пример): `upserted (N): …`, `orphan (M): code1, code2`. HTTP endpoint sync в MVP нет.

### Orphan (soft)

Код есть в БД, но отсутствует в текущем glob `setting.json`:

- строка `main_claimant` **не удаляется** (FK на accesses);
- `access_options` → `{}`;
- code печатается в stdout (`orphan (N): …`);
- в UI вкладок orphan не появляется (дерево из `ProtectedAppModules` + setting).

Ручной DELETE через API по-прежнему возможен; sync его не заменяет.

### Deploy

Порядок: **migrate → claimant:sync**. В `server/update` уже есть оба шага:

```
doctrine:migrations:migrate
main:claimant:sync
```

### Scope sync vs Admin UI

- Sync читает **все** `server/src/*/setting.json` (включая Todo, IBlock) → upsert в `main_claimant`.
- Вкладка «Доступ к приложениям» / User & Group Access: только модули из `ProtectedAppModules` (`main`, `device`, `explorer`, `schooltask`, `inccom`, `calendar`). Todo/IBlock в UI **не** показываются, пока явно не добавят в `ProtectedAppModules`.

### Каталог прав для Main Admin UI

**Не** использовать `GET /api/account/map` (и `/api/scope/map`) как каталог чекбоксов для вкладок User/Group Access.  
Каталог: `GET /api/main/claimant/app-access-modules` + поле `access_options` (также в list/detail claimant).  
`/api/account/map` остаётся для auth/runtime (сырой file `map-access`).

### Воспроизводимый путь

`edit setting.json` → `php bin/console main:claimant:sync` → перезагрузить Main Admin → вкладки Access показывают новые `can_*` из БД.

## См. также

- [ARCHITECTURE.md](ARCHITECTURE.md) — §2.3 бизнес-приложения, §3.2 Window Lifecycle, ADR access_options / user_app_data
- [ADR-user-app-data.md](ADR-user-app-data.md) — границы `user_settings` / `user_app_data` / домен / `User.options`
- [API_SPEC.md](API_SPEC.md) — REST endpoints (`/api/settings`, `/api/user-data`, …)
- [README.md](../README.md) — запуск проекта
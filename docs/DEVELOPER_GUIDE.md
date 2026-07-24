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

## См. также

- [ARCHITECTURE.md](ARCHITECTURE.md) — §2.3 бизнес-приложения, §3.2 Window Lifecycle
- [API_SPEC.md](API_SPEC.md) — REST endpoints для `services/`
- [README.md](../README.md) — запуск проекта

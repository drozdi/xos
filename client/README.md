# Клиент XOS

React 19, Vite, Mantine. Окна и меню «Пуск» живут в `src/apps` и `src/core`.

```
npm ci
npm run dev
npm test
npx tsc --noEmit
npm run build
node scripts/check-bundle-size.mjs
```

Прокси Vite отправляет `/api` и `/uploads` на `http://localhost:8000`. Как поднять API: [../docs/DEVELOPER_GUIDE.md](../docs/DEVELOPER_GUIDE.md).

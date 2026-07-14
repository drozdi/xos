# XOS Client — Performance Checklist

> Этап 11.5: ручная проверка производительности UI (без автоматизации Lighthouse).

## Целевые метрики (TZ)

| Метрика | Цель |
|---------|------|
| Core bundle (gzip) | < 200 KB |
| Window drag | 60 FPS |
| Списки > 100 строк | `react-window` (`VirtualTable`) |

## Bundle analysis

```bash
cd client
npm run build          # размеры чанков в stdout
npm run analyze        # dist/stats.html (rollup-plugin-visualizer)
```

Проверить:
- [ ] Entry chunk (`index-*.js`) gzip < 200 KB
- [ ] Apps в отдельных чанках (`app-users`, `app-demo-calculator`, …)
- [ ] `react-window` не в entry (только при VirtualTable > threshold)
- [ ] Desktop / LoginScreen — отдельные lazy-чанки

## Window drag — 60 FPS

1. Запустить `npm run dev`, войти в систему.
2. Открыть 2–3 окна (Calculator, Users).
3. DevTools → **Performance** → Record.
4. Перетаскивать окно 5–10 секунд по диагонали.
5. Stop → проверить:
   - [ ] FPS стабильно ~60 (зелёная полоса)
   - [ ] Нет длинных Main Thread tasks (> 50 ms) на каждый `mousemove`
   - [ ] `will-change: transform` на Rnd во время drag (Elements → computed)

## VirtualTable

1. Users app с > 100 записями (или mock в dev).
2. Проверить:
   - [ ] Плавный скролл списка
   - [ ] В DOM только видимые строки + overscan
   - [ ] При ≤ 100 — обычная Mantine Table

## Lazy loading

- [ ] Network: Desktop chunk грузится после auth
- [ ] LoginScreen chunk — до входа
- [ ] App chunks — при открытии из Start Menu
- [ ] Child modal — при первом `createChildWindow`

## Регрессии

- [ ] Login → Desktop → Settings → Logout
- [ ] Restore окон после reload
- [ ] Taskbar / Start Menu / Running apps

# TODO: «Файлы урока» — upload без прикрепления

Источник: файл загружается в библиотеку, но не появляется в «Прикреплено к уроку» и не уходит в `event.files` при сохранении.

Отдельного `docs/PLAN.md` нет — задачи из ТЗ.

Ожидание: после «Загрузить» файл в библиотеке, в списке «Прикреплено к уроку», ids в стейте родителя и в `teacherSave` (`event[files][]`).

## Итерация 1: Прикрепить загруженный файл к уроку

- [x] **1.1** Child-окно замораживает `attachedIds`: `createChildWindow` кладёт snapshot JSX в zustand, родительский ререндер панель не обновляет. В `EventLessonFilesPanel` — локальный стейт ids+meta (seed из props), после upload/import/toggle обновлять его и звать `onAttachedChange`. Сразу мержить uploaded в attached meta (не ждать library query). Не резолвить attached только через `filesQuery` (иначе пустой список при race).
- [x] **1.2** Ids до родителя и в save: `EventTeacherModal` принимает полный список ids; `teacherSave` шлёт `event[files][]`. Не затирать ids эффектом `detailQuery`/`editor` после attach. При необходимости `attachedIdsRef` в mutationFn.
- [x] **1.3** Schema upload: `teacherFileSchema.id` через `z.coerce.number()` (строка id не должна ронять parse). Interceptor не трогать. Минимальный дифф, не коммитить.

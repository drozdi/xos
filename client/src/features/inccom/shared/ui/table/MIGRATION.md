# IncCom table → components/table

Дублирование: `features/inccom/shared/ui/table` и `components/table`.

**Целевое состояние:** единый модуль `client/src/components/table`.

**Промежуточно:** IncCom-таблица остаётся до поэтапного переноса виджетов (grouped-tree, account-specific columns).

При новых фичах — расширять `components/table`, не копировать в IncCom.

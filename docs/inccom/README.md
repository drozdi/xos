# Доходы и расходы

Счета, операции, переводы, категории, позиции чека и связь с ФНС.

Доступ: `ROLE_INCCOM`. Свой вход стенда: `/api/IncCom/auth`.

Одно окно `inccom`. На истории операций есть бюджет месяца, полоска расхода и импорт CSV `дата;сумма;комментарий`.

Код: `server/src/IncCom`, `client/src/apps/inccom`, `client/src/features/inccom`.

См. [TZ.md](TZ.md), [API.md](API.md).

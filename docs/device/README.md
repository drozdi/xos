# Устройства

Учёт техники, комплектующих, программ, лицензий и свойств.

Доступ: `ROLE_DEVICE`. Списки фильтруются активным подразделением.

## Приложения

Списки: устройства, комплектующие, типы, свойства, типы комплектующих, программы, типы программ, лицензии.

Карточки открываются из списков: `device-device`, `device-sub-device`, `device-type`, `device-property`, `device-component`, `device-software`, `device-software-type`, `device-license`, `device-license-key`.

На карточке устройства есть поле «Позиция склада»: id записи Assets, ключ `device.asset.{id}` в user-data.

Код: `server/src/Device`, `client/src/apps/device-*`.

См. [TZ.md](TZ.md), [API.md](API.md).

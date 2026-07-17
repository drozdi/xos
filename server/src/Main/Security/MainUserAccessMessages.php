<?php

namespace Main\Security;

final class MainUserAccessMessages
{
    public const READ = 'Нет прав на просмотр пользователей';
    public const CREATE = 'Нет прав на создание пользователя';
    public const UPDATE = 'Нет прав на изменение пользователя';
    public const DELETE = 'Нет прав на удаление пользователя';
    public const GROUP = 'Нет прав на управление группами пользователя';
    public const ACCESS = 'Нет прав на управление правами пользователя';
    public const ROLE = 'Нет прав на управление ролями пользователя';
    public const NOT_FOUND = 'Пользователь не найден';
}

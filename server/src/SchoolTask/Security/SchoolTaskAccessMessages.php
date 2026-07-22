<?php

namespace SchoolTask\Security;

final class SchoolTaskAccessMessages
{
    public const READ_SUBJECT = 'Нет прав на просмотр предметов';
    public const CREATE_SUBJECT = 'Нет прав на создание предмета';
    public const UPDATE_SUBJECT = 'Нет прав на изменение предмета';
    public const DELETE_SUBJECT = 'Нет прав на удаление предмета';
    public const SUBJECT_NOT_FOUND = 'Предмет не найден';

    public const READ_CLASS = 'Нет прав на просмотр классов';
    public const CREATE_CLASS = 'Нет прав на создание класса';
    public const UPDATE_CLASS = 'Нет прав на изменение класса';
    public const DELETE_CLASS = 'Нет прав на удаление класса';
    public const CLASS_NOT_FOUND = 'Класс не найден';

    public const READ_EVENT = 'Нет прав на просмотр календаря';
    public const CREATE_EVENT = 'Нет прав на создание события';
    public const UPDATE_EVENT = 'Нет прав на изменение события';
    public const DELETE_EVENT = 'Нет прав на удаление события';
    public const EVENT_NOT_FOUND = 'Событие не найдено';

    public const READ_ZAM = 'Нет прав на управление составом групп';
    public const UPDATE_ZAM = 'Нет прав на изменение состава групп';
    public const PARALLEL_NOT_FOUND = 'Параллель не найдена';
    public const GROUP_NOT_FOUND = 'Группа не найдена';
    public const PUPIL_ALREADY_IN_CLASS = 'Ученик уже состоит в другом классе';
    public const PUPIL_NOT_IN_PARALLEL = 'Ученик не состоит в этой параллели';
}

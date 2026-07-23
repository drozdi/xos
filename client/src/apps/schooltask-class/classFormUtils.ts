import type { ClassDetail, ClassSubGroup } from '@/core/api/endpoints/schooltaskApi';

export const CLASS_NAME_EXISTS = 'Класс с таким названием уже существует';
export const SUBGROUP_NAME_EXISTS = 'Подгруппа с таким названием уже существует';
export const PARALLEL_NAME_EXISTS = 'Параллель с таким названием уже существует';
export const SUBGROUP_NAME_REQUIRED = 'Укажите название подгруппы';

export type ClassFormErrors = Partial<Record<'name' | 'parent_id' | 'sub', string>>;

export type ValidateClassFormOptions = {
	/** Существующие классы: id + name (для проверки уникальности названия). */
	existingClasses?: Array<{ id: number; name: string }>;
	/** Id текущего класса (при редактировании исключается из проверки). */
	excludeClassId?: number;
};

export function normalizeGroupName(name: string | null | undefined): string {
	return (name ?? '').trim();
}

export function validateClassForm(
	data: ClassDetail,
	options: ValidateClassFormOptions = {},
): ClassFormErrors {
	const errors: ClassFormErrors = {};
	const name = normalizeGroupName(data.name);

	if (!name) {
		errors.name = 'Укажите название';
	} else {
		const excludeId = options.excludeClassId ?? data.id ?? 0;
		const duplicate = (options.existingClasses ?? []).some(
			(item) =>
				item.id !== excludeId && normalizeGroupName(item.name) === name,
		);
		if (duplicate) {
			errors.name = CLASS_NAME_EXISTS;
		}
	}

	if (!data.parent_id) {
		errors.parent_id = 'Выберите параллель';
	}

	const subError = validateSubGroupNames(data.sub);
	if (subError) {
		errors.sub = subError;
	}

	return errors;
}

export function validateSubGroupNames(sub: ClassSubGroup[] | undefined): string | null {
	const names = (sub ?? []).map((row) => normalizeGroupName(row.name));
	if (names.some((name) => !name)) {
		return SUBGROUP_NAME_REQUIRED;
	}

	const seen = new Set<string>();
	for (const name of names) {
		if (seen.has(name)) {
			return SUBGROUP_NAME_EXISTS;
		}
		seen.add(name);
	}

	return null;
}

/** Индексы подгрупп с дублирующимся или пустым именем. */
export function getInvalidSubGroupIndexes(sub: ClassSubGroup[] | undefined): Set<number> {
	const rows = sub ?? [];
	const invalid = new Set<number>();
	const byName = new Map<string, number[]>();

	rows.forEach((row, index) => {
		const name = normalizeGroupName(row.name);
		if (!name) {
			invalid.add(index);
			return;
		}
		const list = byName.get(name) ?? [];
		list.push(index);
		byName.set(name, list);
	});

	for (const indexes of byName.values()) {
		if (indexes.length > 1) {
			indexes.forEach((index) => invalid.add(index));
		}
	}

	return invalid;
}

export function isParallelNameTaken(
	name: string,
	existingParallelNames: string[],
): boolean {
	const normalized = normalizeGroupName(name);
	if (!normalized) {
		return false;
	}
	return existingParallelNames.some((item) => normalizeGroupName(item) === normalized);
}

export function normalizeClassUsers(users: ClassDetail['users']) {
	return (users ?? []).map((item, index) => ({
		id: item.id ?? index + 1,
		user_id: item.user_id,
	}));
}

/** Имя предметной группы по умолчанию: «Класс Предмет». */
export function buildSubGroupName(
	className: string | null | undefined,
	subjectName: string | null | undefined,
): string {
	return [normalizeGroupName(className), normalizeGroupName(subjectName)].filter(Boolean).join(' ');
}

export function prepareClassSavePayload(data: ClassDetail): ClassDetail {
	const classUserIds = new Set(normalizeClassUsers(data.users).map((item) => item.user_id));

	return {
		...data,
		name: normalizeGroupName(data.name),
		users: normalizeClassUsers(data.users),
		sub: (data.sub ?? []).map((item) => ({
			...item,
			name: normalizeGroupName(item.name),
			parent_id: data.id || item.parent_id,
			users: (item.users ?? []).filter((user) => classUserIds.has(user.user_id)),
		})),
	};
}

export function updateSubGroup(
	sub: ClassSubGroup[] | undefined,
	index: number,
	patch: Partial<ClassSubGroup>,
): ClassSubGroup[] {
	const next = [...(sub ?? [])];
	const current = next[index];
	if (!current) {
		return next;
	}
	next[index] = { ...current, ...patch };
	return next;
}

export function addSubGroup(sub: ClassSubGroup[] | undefined, parentId: number): ClassSubGroup[] {
	return [
		...(sub ?? []),
		{
			id: 0,
			group_id: 0,
			name: '',
			parent_id: parentId,
			user_id: null,
			subject_id: null,
		},
	];
}

export function removeSubGroup(sub: ClassSubGroup[] | undefined, index: number): ClassSubGroup[] {
	return (sub ?? []).filter((_, itemIndex) => itemIndex !== index);
}

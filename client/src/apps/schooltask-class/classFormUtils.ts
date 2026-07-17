import type { ClassDetail, ClassSubGroup } from '@/core/api/endpoints/schooltaskApi';

export function validateClassForm(data: ClassDetail) {
	const errors: Partial<Record<'name' | 'parent_id', string>> = {};
	if (!data.name?.trim()) {
		errors.name = 'Укажите название';
	}
	if (!data.parent_id) {
		errors.parent_id = 'Выберите параллель';
	}
	return errors;
}

export function normalizeClassUsers(users: ClassDetail['users']) {
	return (users ?? []).map((item, index) => ({
		id: item.id ?? index + 1,
		user_id: item.user_id,
	}));
}

export function prepareClassSavePayload(data: ClassDetail): ClassDetail {
	return {
		...data,
		users: normalizeClassUsers(data.users),
		sub: (data.sub ?? []).map((item) => ({
			...item,
			parent_id: data.id || item.parent_id,
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

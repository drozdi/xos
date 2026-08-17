import { Group, MultiSelect, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';

import type { BoardLabel, BoardMember } from '@/core/api/endpoints/boardApi';

import type { BoardUiFilters } from './boardPrefs';

interface BoardFiltersProps {
	filters: BoardUiFilters;
	onChange: (filters: BoardUiFilters) => void;
	members: BoardMember[];
	labels: BoardLabel[];
}

function memberLabel(member: BoardMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
}

export function BoardFilters({ filters, onChange, members, labels }: BoardFiltersProps) {
	const memberOptions = members
		.filter((m) => m.user_id != null)
		.map((m) => ({ value: String(m.user_id), label: memberLabel(m) }));

	const labelOptions = labels.map((l) => ({ value: String(l.id), label: l.name }));

	return (
		<Group px="md" py="xs" gap="md" wrap="wrap" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)' }}>
			<MultiSelect
				placeholder="Исполнители"
				data={memberOptions}
				value={filters.assigneeIds.map(String)}
				onChange={(values) => onChange({ ...filters, assigneeIds: values.map(Number) })}
				clearable
				searchable
				size="xs"
				w={200}
			/>
			<MultiSelect
				placeholder="Метки"
				data={labelOptions}
				value={filters.labelIds.map(String)}
				onChange={(values) => onChange({ ...filters, labelIds: values.map(Number) })}
				clearable
				searchable
				size="xs"
				w={200}
			/>
			<DatePickerInput
				placeholder="Срок от"
				value={filters.dueAfter ? dayjs(filters.dueAfter).toDate() : null}
				onChange={(date) =>
					onChange({
						...filters,
						dueAfter: date ? dayjs(date).format('YYYY-MM-DD') : null,
					})
				}
				clearable
				size="xs"
				w={140}
			/>
			<DatePickerInput
				placeholder="Срок до"
				value={filters.dueBefore ? dayjs(filters.dueBefore).toDate() : null}
				onChange={(date) =>
					onChange({
						...filters,
						dueBefore: date ? dayjs(date).format('YYYY-MM-DD') : null,
					})
				}
				clearable
				size="xs"
				w={140}
			/>
			<TextInput
				placeholder="Поиск…"
				value={filters.q}
				onChange={(e) => onChange({ ...filters, q: e.currentTarget.value })}
				size="xs"
				w={180}
			/>
		</Group>
	);
}

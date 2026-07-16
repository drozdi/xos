import {
	Alert,
	NumberInput,
	Stack,
	Switch,
	TextInput,
	Textarea,
} from '@mantine/core';

import type { GroupDetail } from '@/core/api/endpoints/mainApi';
import { DateTimeField } from '@/core/dates';
import { GroupSelect } from '@/features/main/GroupSelect';
import { OuSelect } from '@/features/main/OuSelect';
import { UserSelect } from '@/features/main/UserSelect';

interface GroupGeneralTabProps {
	data: GroupDetail;
	errors: Partial<Record<keyof GroupDetail & string, string>>;
	readOnly: boolean;
	entityId: number;
	setField: <K extends keyof GroupDetail>(key: K, value: GroupDetail[K]) => void;
}

export function GroupGeneralTab({
	data,
	errors,
	readOnly,
	entityId,
	setField,
}: GroupGeneralTabProps) {
	return (
		<Stack gap="sm">
			<OuSelect
				withAsterisk
				value={data.ou_id ?? null}
				error={errors.ou_id}
				disabled={readOnly}
				onChange={(ouId) => {
					setField('ou_id', ouId);
					setField('parent_id', null);
				}}
			/>
			<GroupSelect
				key={data.ou_id ?? 'no-ou'}
				value={data.parent_id ?? null}
				ouId={data.ou_id}
				excludeId={entityId > 0 ? entityId : undefined}
				disabled={readOnly || !data.ou_id}
				onChange={(parentId) => setField('parent_id', parentId)}
			/>
			<UserSelect
				value={data.user_id ?? null}
				filters={data.ou_id ? { ou: data.ou_id } : undefined}
				disabled={readOnly || !data.ou_id}
				onChange={(userId) => setField('user_id', userId)}
			/>
			<TextInput
				label="Код"
				withAsterisk
				value={data.code ?? ''}
				error={errors.code}
				readOnly={readOnly}
				onChange={(e) => setField('code', e.currentTarget.value)}
			/>
			<TextInput
				label="Название"
				withAsterisk
				value={data.name ?? ''}
				error={errors.name}
				readOnly={readOnly}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>
			<NumberInput
				label="Сортировка"
				value={data.sort ?? 0}
				readOnly={readOnly}
				onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
			/>
			<Textarea
				label="Описание"
				value={data.description ?? ''}
				readOnly={readOnly}
				minRows={3}
				autosize
				onChange={(e) => setField('description', e.currentTarget.value)}
			/>
			<Switch
				label="Активна"
				checked={Boolean(data.active)}
				disabled={readOnly}
				onChange={(e) => setField('active', e.currentTarget.checked)}
			/>
			<Switch
				label="Анонимная"
				checked={Boolean(data.anonymous)}
				disabled={readOnly}
				onChange={(e) => setField('anonymous', e.currentTarget.checked)}
			/>
			<DateTimeField
				label="Активна с"
				value={data.activeFrom as string | null | undefined}
				readOnly={readOnly}
				onChange={(value) => setField('activeFrom', value)}
			/>
			<DateTimeField
				label="Активна по"
				value={data.activeTo as string | null | undefined}
				readOnly={readOnly}
				onChange={(value) => setField('activeTo', value)}
			/>
		</Stack>
	);
}

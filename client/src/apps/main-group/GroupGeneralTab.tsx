import { Alert, Flex, Form, Input, InputNumber, Switch } from 'antd';

import type { GroupDetail } from '@/core/api/endpoints/mainApi';
import { DateTimeField } from '@/core/dates';
import { GroupSelect } from '@/features/main/GroupSelect';
import { OuSelect } from '@/features/main/OuSelect';
import { UserSelect, tutorOuUserFilters } from '@/features/main/UserSelect';

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
		<Flex vertical gap={12}>
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
				filters={tutorOuUserFilters}
				disabled={readOnly}
				onChange={(userId) => setField('user_id', userId)}
			/>
			<Form.Item
				label="Код"
				required
				validateStatus={errors.code ? 'error' : undefined}
				help={errors.code}
				style={{ marginBottom: 0 }}
			>
				<Input
					value={data.code ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('code', e.target.value)}
				/>
			</Form.Item>
			<Form.Item
				label="Название"
				required
				validateStatus={errors.name ? 'error' : undefined}
				help={errors.name}
				style={{ marginBottom: 0 }}
			>
				<Input
					value={data.name ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('name', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Сортировка" style={{ marginBottom: 0 }}>
				<InputNumber
					value={data.sort ?? 0}
					disabled={readOnly}
					style={{ width: '100%' }}
					onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
				/>
			</Form.Item>
			<Form.Item label="Описание" style={{ marginBottom: 0 }}>
				<Input.TextArea
					value={data.description ?? ''}
					readOnly={readOnly}
					rows={3}
					autoSize={{ minRows: 3 }}
					onChange={(e) => setField('description', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Активна" style={{ marginBottom: 0 }}>
				<Switch
					checked={Boolean(data.active)}
					disabled={readOnly}
					onChange={(checked) => setField('active', checked)}
				/>
			</Form.Item>
			<Form.Item label="Анонимная" style={{ marginBottom: 0 }}>
				<Switch
					checked={Boolean(data.anonymous)}
					disabled={readOnly}
					onChange={(checked) => setField('anonymous', checked)}
				/>
			</Form.Item>
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
		</Flex>
	);
}

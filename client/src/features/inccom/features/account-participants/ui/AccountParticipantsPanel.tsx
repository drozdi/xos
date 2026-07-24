import { Button, Flex, Form, Input, Typography } from 'antd';
import { TbTrash } from 'react-icons/tb';

import {
	useAccountAddUser,
	useAccountRemoveUser,
} from '@inccom/entities/account';

interface AccountParticipantsPanelProps {
	accountId: number;
	participants: IAccountParticipant[];
}

export function AccountParticipantsPanel({
	accountId,
	participants,
}: AccountParticipantsPanelProps) {
	const addMutation = useAccountAddUser();
	const removeMutation = useAccountRemoveUser();
	const [form] = Form.useForm<{ login: string }>();

	async function handleAdd(values: { login: string }) {
		await addMutation.mutateAsync({ id: accountId, login: values.login.trim() });
		form.resetFields();
	}

	async function handleRemove(userId: number) {
		await removeMutation.mutateAsync({ id: accountId, userId });
	}

	return (
		<Flex vertical gap={16}>
			<Typography.Text strong>Участники счёта</Typography.Text>
			{participants.length ? (
				participants.map((participant) => (
					<Flex key={participant.id} justify="space-between" align="center">
						<Typography.Text>{participant.login}</Typography.Text>
						<Button
							type="text"
							danger
							icon={<TbTrash />}
							loading={removeMutation.isPending}
							onClick={() => void handleRemove(participant.id)}
						/>
					</Flex>
				))
			) : (
				<Typography.Text type="secondary">Участников пока нет</Typography.Text>
			)}
			<Form
				form={form}
				layout="vertical"
				onFinish={(v) => void handleAdd(v)}
				initialValues={{ login: '' }}
			>
				<Flex align="flex-end" gap={8}>
					<Form.Item
						label="Добавить по логину"
						name="login"
						rules={[{ required: true, message: 'Введите логин' }]}
						style={{ flex: 1, marginBottom: 0 }}
					>
						<Input placeholder="login" />
					</Form.Item>
					<Button type="primary" htmlType="submit" loading={addMutation.isPending}>
						Добавить
					</Button>
				</Flex>
			</Form>
		</Flex>
	);
}

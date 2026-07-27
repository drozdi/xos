import {
	useAccountAddUser,
	useAccountRemoveUser,
} from '@inccom/entities/account';
import {
	ActionIcon,
	Button,
	Group,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { TbTrash } from 'react-icons/tb';

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

	const form = useForm({
		initialValues: { login: '' },
		validate: {
			login: (value) => (value.trim() ? null : 'Введите логин'),
		},
	});

	async function handleAdd(values: { login: string }) {
		await addMutation.mutateAsync({ id: accountId, login: values.login.trim() });
		form.reset();
	}

	async function handleRemove(userId: number) {
		await removeMutation.mutateAsync({ id: accountId, userId });
	}

	return (
		<Stack gap="md">
			<Text fw={600}>Участники счёта</Text>
			{participants.length ? (
				participants.map((participant) => (
					<Group key={participant.id} justify="space-between">
						<Text>{participant.login}</Text>
						<ActionIcon
							color="red"
							variant="subtle"
							onClick={() => handleRemove(participant.id)}
							loading={removeMutation.isPending}
						>
							<TbTrash />
						</ActionIcon>
					</Group>
				))
			) : (
				<Text c="dimmed" size="sm">
					Участников пока нет
				</Text>
			)}
			<form onSubmit={form.onSubmit(handleAdd)}>
				<Group align="flex-end">
					<TextInput
						label="Добавить по логину"
						placeholder="login"
						style={{ flex: 1 }}
						{...form.getInputProps('login')}
					/>
					<Button type="submit" loading={addMutation.isPending}>
						Добавить
					</Button>
				</Group>
			</form>
		</Stack>
	);
}

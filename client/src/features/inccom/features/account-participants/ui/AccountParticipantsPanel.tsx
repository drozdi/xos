import {
	useAccountAddUser,
	useAccountRemoveUser,
} from '@inccom/entities/account';
import type { IAccountParticipant } from '@inccom/entities/account';
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

function formatParticipantLabel(participant: IAccountParticipant): string {
	const name = participant.name?.trim() || participant.login || 'Пользователь';
	const email = participant.email?.trim();
	return email ? `${name} (${email})` : name;
}

export function AccountParticipantsPanel({
	accountId,
	participants,
}: AccountParticipantsPanelProps) {
	const addMutation = useAccountAddUser();
	const removeMutation = useAccountRemoveUser();

	const form = useForm({
		initialValues: { email: '' },
		validate: {
			email: (value) => {
				const trimmed = value.trim();
				if (!trimmed) return 'Введите email';
				if (!trimmed.includes('@')) return 'Некорректный email';
				return null;
			},
		},
	});

	async function handleAdd(values: { email: string }) {
		await addMutation.mutateAsync({
			id: accountId,
			email: values.email.trim(),
		});
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
						<Text>{formatParticipantLabel(participant)}</Text>
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
						label="Добавить по email"
						placeholder="user@example.com"
						style={{ flex: 1 }}
						{...form.getInputProps('email')}
					/>
					<Button type="submit" loading={addMutation.isPending}>
						Добавить
					</Button>
				</Group>
			</form>
		</Stack>
	);
}

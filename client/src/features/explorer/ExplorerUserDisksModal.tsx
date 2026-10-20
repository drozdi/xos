import {
	Anchor,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKeys } from '@/core/api/queryKeys';

import {
	createUserDisk,
	deleteUserDisk,
	fetchUserDisks,
	type UserDiskRecord,
} from './explorerApi';

interface ExplorerUserDisksModalProps {
	opened: boolean;
	onClose: () => void;
}

const ADAPTER_OPTIONS = [
	{ value: 'local', label: 'Локальный (чтение/запись)' },
	{ value: 'local_readonly', label: 'Локальный (только чтение)' },
	{ value: 'yandex_disk', label: 'Яндекс.Диск' },
];

const YANDEX_TOKEN_DOCS =
	'https://yandex.ru/dev/disk-api/doc/ru/concepts/quickstart.md';

function diskConfigSummary(disk: UserDiskRecord): string {
	if (disk.adapter === 'yandex_disk') {
		const hint = disk.config?.tokenHint;
		return hint ? `OAuth …${hint}` : 'Яндекс.Диск';
	}
	return disk.config?.root ?? '—';
}

export function ExplorerUserDisksModal({ opened, onClose }: ExplorerUserDisksModalProps) {
	const queryClient = useQueryClient();
	const [code, setCode] = useState('');
	const [label, setLabel] = useState('');
	const [adapter, setAdapter] = useState('local');
	const [root, setRoot] = useState('');
	const [oauthToken, setOauthToken] = useState('');

	const isYandex = adapter === 'yandex_disk';

	const disksQuery = useQuery({
		queryKey: queryKeys.explorer.disks,
		queryFn: fetchUserDisks,
		enabled: opened,
	});

	const createMutation = useMutation({
		mutationFn: createUserDisk,
		onSuccess: async () => {
			setCode('');
			setLabel('');
			setRoot('');
			setOauthToken('');
			setAdapter('local');
			await queryClient.invalidateQueries({ queryKey: queryKeys.explorer.disks });
			await queryClient.invalidateQueries({ queryKey: queryKeys.explorer.config });
			notifications.show({ message: 'Диск добавлен', color: 'green' });
		},
		onError: () => {
			notifications.show({ message: 'Не удалось добавить диск', color: 'red' });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteUserDisk,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.explorer.disks });
			await queryClient.invalidateQueries({ queryKey: queryKeys.explorer.config });
			notifications.show({ message: 'Диск удалён', color: 'green' });
		},
		onError: () => {
			notifications.show({ message: 'Не удалось удалить диск', color: 'red' });
		},
	});

	const handleCreate = () => {
		if (!code.trim() || !label.trim()) {
			return;
		}
		if (isYandex) {
			if (!oauthToken.trim()) {
				return;
			}
			createMutation.mutate({
				code: code.trim(),
				label: label.trim(),
				adapter,
				oauthToken: oauthToken.trim(),
			});
			return;
		}
		if (!root.trim()) {
			return;
		}
		createMutation.mutate({
			code: code.trim(),
			label: label.trim(),
			adapter,
			root: root.trim(),
		});
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Пользовательские диски" size="lg">
			<Stack gap="md">
				<Text size="sm" c="dimmed">
					{isYandex ? (
						<>
							Укажите код, название и OAuth-токен Яндекс.Диска. Токен:{' '}
							<Anchor href={YANDEX_TOKEN_DOCS} target="_blank" rel="noreferrer" size="sm">
								получить в документации API
							</Anchor>{' '}
							(права cloud_api:disk.read и cloud_api:disk.write). У одного пользователя может быть
							несколько дисков с разными токенами.
						</>
					) : (
						'Укажите код диска (латиница), название и абсолютный путь на сервере.'
					)}
				</Text>

				<Group align="flex-end" wrap="wrap">
					<TextInput
						label="Код"
						placeholder={isYandex ? 'yandex' : 'mydisk'}
						value={code}
						onChange={(e) => setCode(e.currentTarget.value)}
						w={120}
					/>
					<TextInput
						label="Название"
						placeholder={isYandex ? 'Яндекс.Диск' : 'Мой диск'}
						value={label}
						onChange={(e) => setLabel(e.currentTarget.value)}
						w={180}
					/>
					<Select
						label="Адаптер"
						data={ADAPTER_OPTIONS}
						value={adapter}
						onChange={(value) => value && setAdapter(value)}
						w={220}
					/>
					{isYandex ? (
						<TextInput
							label="OAuth-токен"
							placeholder="0c4181a7…"
							type="password"
							value={oauthToken}
							onChange={(e) => setOauthToken(e.currentTarget.value)}
							style={{ flex: 1, minWidth: 220 }}
						/>
					) : (
						<TextInput
							label="Путь на сервере"
							placeholder="C:/data/mydisk"
							value={root}
							onChange={(e) => setRoot(e.currentTarget.value)}
							style={{ flex: 1, minWidth: 220 }}
						/>
					)}
					<Button onClick={handleCreate} loading={createMutation.isPending}>
						Добавить
					</Button>
				</Group>

				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Код</Table.Th>
							<Table.Th>Название</Table.Th>
							<Table.Th>Адаптер</Table.Th>
							<Table.Th>Параметры</Table.Th>
							<Table.Th w={80} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{(disksQuery.data ?? []).map((disk: UserDiskRecord) => (
							<Table.Tr key={disk.id}>
								<Table.Td>{disk.code}</Table.Td>
								<Table.Td>{disk.label}</Table.Td>
								<Table.Td>{disk.adapter}</Table.Td>
								<Table.Td>{diskConfigSummary(disk)}</Table.Td>
								<Table.Td>
									<Button
										size="xs"
										color="red"
										variant="light"
										loading={deleteMutation.isPending}
										onClick={() => deleteMutation.mutate(disk.id)}
									>
										×
									</Button>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Stack>
		</Modal>
	);
}

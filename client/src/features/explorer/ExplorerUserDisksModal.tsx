import { Button, Flex, Form, Input, Modal, Select, Table, Typography } from 'antd';
import { notifications } from '@/ui/toast';
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
];

export function ExplorerUserDisksModal({ opened, onClose }: ExplorerUserDisksModalProps) {
	const queryClient = useQueryClient();
	const [code, setCode] = useState('');
	const [label, setLabel] = useState('');
	const [adapter, setAdapter] = useState('local');
	const [root, setRoot] = useState('');

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
		if (!code.trim() || !label.trim() || !root.trim()) {
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
		<Modal open={opened} onCancel={onClose} title="Пользовательские диски" width={800} footer={null}>
			<Flex vertical gap="middle">
				<Typography.Text type="secondary" style={{ fontSize: 13 }}>
					Укажите код диска (латиница), название и абсолютный путь на сервере.
				</Typography.Text>

				<Flex align="flex-end" wrap="wrap" gap="small">
					<Form.Item label="Код" style={{ marginBottom: 0, width: 120 }}>
						<Input placeholder="mydisk" value={code} onChange={(e) => setCode(e.target.value)} />
					</Form.Item>
					<Form.Item label="Название" style={{ marginBottom: 0, width: 180 }}>
						<Input placeholder="Мой диск" value={label} onChange={(e) => setLabel(e.target.value)} />
					</Form.Item>
					<Form.Item label="Адаптер" style={{ marginBottom: 0, width: 220 }}>
						<Select
							options={ADAPTER_OPTIONS}
							value={adapter}
							onChange={(value) => setAdapter(value)}
							style={{ width: '100%' }}
						/>
					</Form.Item>
					<Form.Item label="Путь на сервере" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
						<Input
							placeholder="C:/data/mydisk"
							value={root}
							onChange={(e) => setRoot(e.target.value)}
						/>
					</Form.Item>
					<Button type="primary" onClick={handleCreate} loading={createMutation.isPending}>
						Добавить
					</Button>
				</Flex>

				<Table
					size="small"
					pagination={false}
					rowKey="id"
					dataSource={disksQuery.data ?? []}
					columns={[
						{ title: 'Код', dataIndex: 'code' },
						{ title: 'Название', dataIndex: 'label' },
						{ title: 'Адаптер', dataIndex: 'adapter' },
						{
							title: 'Путь',
							render: (_: unknown, disk: UserDiskRecord) => disk.config?.root ?? '—',
						},
						{
							title: '',
							width: 80,
							render: (_: unknown, disk: UserDiskRecord) => (
								<Button
									size="small"
									danger
									loading={deleteMutation.isPending}
									onClick={() => deleteMutation.mutate(disk.id)}
								>
									×
								</Button>
							),
						},
					]}
				/>
			</Flex>
		</Modal>
	);
}

import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';

interface SearchReplaceModalProps {
	vaultId: number;
	opened: boolean;
	onClose: () => void;
	canWrite: boolean;
}

export function SearchReplaceModal({ vaultId, opened, onClose, canWrite }: SearchReplaceModalProps) {
	const [find, setFind] = useState('');
	const [replace, setReplace] = useState('');
	const [preview, setPreview] = useState<{ matchedFiles: number; paths: string[] } | null>(null);

	const previewMutation = useMutation({
		mutationFn: () =>
			pkbApi.searchReplace(vaultId, { find, replace, dryRun: true }),
		onSuccess: (data) => {
			setPreview({ matchedFiles: data.matchedFiles, paths: data.paths });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось выполнить предпросмотр' });
		},
	});

	const replaceMutation = useMutation({
		mutationFn: () =>
			pkbApi.searchReplace(vaultId, { find, replace, dryRun: false }),
		onSuccess: (data) => {
			notifications.show({
				color: 'green',
				message: `Заменено в ${data.replacedFiles} файлах`,
			});
			setPreview(null);
			onClose();
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось выполнить замену' });
		},
	});

	const handleClose = () => {
		setPreview(null);
		onClose();
	};

	return (
		<Modal opened={opened} onClose={handleClose} title="Поиск и замена" size="md">
			<Stack gap="md">
				<TextInput
					label="Найти"
					value={find}
					onChange={(event) => {
						setFind(event.currentTarget.value);
						setPreview(null);
					}}
				/>
				<TextInput
					label="Заменить на"
					value={replace}
					onChange={(event) => setReplace(event.currentTarget.value)}
				/>
				{preview ? (
					<Stack gap="xs">
						<Text size="sm">
							Найдено файлов: <strong>{preview.matchedFiles}</strong>
						</Text>
						{preview.paths.slice(0, 10).map((path) => (
							<Text key={path} size="xs" c="dimmed" lineClamp={1}>
								{path}
							</Text>
						))}
						{preview.paths.length > 10 ? (
							<Text size="xs" c="dimmed">
								…и ещё {preview.paths.length - 10}
							</Text>
						) : null}
					</Stack>
				) : null}
				<Group justify="flex-end">
					<Button
						variant="light"
						onClick={() => previewMutation.mutate()}
						loading={previewMutation.isPending}
						disabled={!find.trim()}
					>
						Предпросмотр
					</Button>
					<Button
						onClick={() => replaceMutation.mutate()}
						loading={replaceMutation.isPending}
						disabled={!canWrite || !find.trim() || preview === null || preview.matchedFiles === 0}
					>
						Заменить
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

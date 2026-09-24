import { Button, FileButton, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { AuthFileImage } from '@/core/api/AuthFileImage';
import { notifyApiError } from '@/core/api/apiError';
import { uploadIblockFile } from '@/core/api/endpoints/iblockApi';

export type IblockImageValue = {
	id: number;
	name: string;
	src: string;
} | null;

export function IblockImageField({
	label,
	value,
	readOnly,
	onChange,
}: {
	label: string;
	value: IblockImageValue | undefined;
	readOnly?: boolean;
	onChange: (next: IblockImageValue) => void;
}) {
	const [uploading, setUploading] = useState(false);
	const hasFile = value?.id != null;

	const upload = async (file: File | null) => {
		if (!file || readOnly) return;
		setUploading(true);
		try {
			const uploaded = await uploadIblockFile(file);
			onChange({
				id: uploaded.id,
				name: uploaded.name,
				src: uploaded.src,
			});
		} catch (error) {
			notifyApiError(error, `Ошибка загрузки: ${label}`);
		} finally {
			setUploading(false);
		}
	};

	return (
		<Stack gap="xs">
			<Text size="sm" fw={500}>
				{label}
			</Text>
			{hasFile ? (
				<AuthFileImage
					fileId={value?.id}
					alt={value?.name || label}
					h={120}
					w="auto"
					fit="contain"
					radius="sm"
				/>
			) : (
				<Text size="sm" c="dimmed">
					Нет изображения
				</Text>
			)}
			{!readOnly && (
				<Group gap="xs">
					<FileButton onChange={upload} accept="image/*" disabled={uploading}>
						{(props) => (
							<Button {...props} size="xs" variant="light" loading={uploading}>
								{hasFile ? 'Заменить' : 'Загрузить'}
							</Button>
						)}
					</FileButton>
					{hasFile && (
						<Button size="xs" variant="subtle" color="red" onClick={() => onChange(null)}>
							Убрать
						</Button>
					)}
				</Group>
			)}
		</Stack>
	);
}

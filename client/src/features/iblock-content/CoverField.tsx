import { Button, FileButton, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { AuthFileImage } from '@/core/api/AuthFileImage';
import { notifyApiError } from '@/core/api/apiError';
import { uploadIblockFile, type IblockElementDetail } from '@/core/api/endpoints/iblockApi';

import { CONTENT_PROPS } from './contentCatalog';
import { fileItemsFromProperty, patchPropertyValues } from './propertyValues';

type Values = IblockElementDetail['PROPERTY_VALUES'];
type FileItem = { id: number; name: string; src: string };

export function CoverField({
	values,
	readOnly,
	multiple = false,
	onChange,
}: {
	values: Values | undefined;
	readOnly?: boolean;
	/** Multiple file property (recipes COVER). */
	multiple?: boolean;
	onChange: (next: Values) => void;
}) {
	const [uploading, setUploading] = useState(false);
	const items = fileItemsFromProperty(values?.[CONTENT_PROPS.COVER]);
	const hasFile = items.length > 0;

	const setItems = (next: FileItem[]) => {
		if (multiple) {
			onChange(patchPropertyValues(values, CONTENT_PROPS.COVER, next.length > 0 ? next : []));
		} else {
			onChange(patchPropertyValues(values, CONTENT_PROPS.COVER, next[0] ?? null));
		}
	};

	const upload = async (payload: File | File[] | null) => {
		if (readOnly) return;
		const files = Array.isArray(payload) ? payload : payload ? [payload] : [];
		if (files.length === 0) return;
		setUploading(true);
		try {
			const uploaded: FileItem[] = [];
			for (const file of files) {
				const row = await uploadIblockFile(file);
				uploaded.push({ id: row.id, name: row.name, src: row.src });
			}
			if (multiple) {
				setItems([...items, ...uploaded]);
			} else {
				setItems(uploaded.slice(0, 1));
			}
		} catch (error) {
			notifyApiError(error, 'Ошибка загрузки обложки');
		} finally {
			setUploading(false);
		}
	};

	return (
		<Stack gap="xs">
			<Text size="sm" fw={500}>
				{multiple ? 'Обложки' : 'Обложка'}
			</Text>
			{items.length > 0 ? (
				<Group gap="sm" wrap="wrap">
					{items.map((item) => (
						<Stack key={item.id} gap={4} align="flex-start">
							<AuthFileImage
								fileId={item.id}
								alt={item.name || 'cover'}
								h={120}
								w="auto"
								fit="contain"
								radius="sm"
							/>
							{!readOnly && (
								<Button
									size="compact-xs"
									variant="subtle"
									color="red"
									onClick={() => setItems(items.filter((row) => row.id !== item.id))}
								>
									Убрать
								</Button>
							)}
						</Stack>
					))}
				</Group>
			) : (
				<Text size="sm" c="dimmed">
					Нет изображения
				</Text>
			)}
			{!readOnly && (
				<Group gap="xs">
					<FileButton
						onChange={upload}
						accept="image/*"
						multiple={multiple}
						disabled={uploading}
					>
						{(props) => (
							<Button {...props} size="xs" variant="light" loading={uploading}>
								{multiple ? 'Добавить' : hasFile ? 'Заменить' : 'Загрузить'}
							</Button>
						)}
					</FileButton>
					{!multiple && hasFile && (
						<Button size="xs" variant="subtle" color="red" onClick={() => setItems([])}>
							Убрать
						</Button>
					)}
					{multiple && hasFile && (
						<Button size="xs" variant="subtle" color="red" onClick={() => setItems([])}>
							Очистить все
						</Button>
					)}
				</Group>
			)}
		</Stack>
	);
}

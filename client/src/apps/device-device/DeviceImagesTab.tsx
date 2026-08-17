import {
	ActionIcon,
	Box,
	Button,
	FileButton,
	Group,
	Image,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconUpload } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { deviceApi } from '@/core/api/endpoints/deviceApi';
import { useCoreApi } from '@/core/hooks/useCoreApi';

import { DeviceImageGallery } from '@/features/device/DeviceImageGallery';

export interface DeviceImageRecord {
	id: number;
	src: string;
	name?: string;
}

interface DeviceImagesTabProps {
	deviceId: number;
	images: Record<string, DeviceImageRecord>;
	readOnly: boolean;
	onChange: (images: Record<string, DeviceImageRecord>) => void;
}

export function DeviceImagesTab({ deviceId, images, readOnly, onChange }: DeviceImagesTabProps) {
	const coreApi = useCoreApi();
	const galleryRef = useRef<{ close: () => void } | null>(null);
	const entries = useMemo(
		() =>
			Object.values(images).sort((a, b) => a.id - b.id),
		[images],
	);

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => deviceApi.uploadImages(deviceId, files),
		onSuccess: (uploaded) => {
			const next = { ...images };
			for (const item of uploaded) {
				next[String(item.id)] = item;
			}
			onChange(next);
			notifications.show({ color: 'green', message: 'Изображения загружены' });
		},
		onError: (error) => notifyApiError(error, 'Ошибка загрузки изображений'),
	});

	const removeImage = (id: number) => {
		const next = { ...images };
		delete next[String(id)];
		onChange(next);
	};

	const openGallery = (initialIndex: number) => {
		galleryRef.current?.close();
		const handle = coreApi.window.createChildWindow({
			title: 'Изображения устройства',
			width: 720,
			height: 540,
			content: (
				<DeviceImageGallery
					images={entries}
					initialIndex={initialIndex}
					onClose={() => handle.close()}
				/>
			),
		});
		galleryRef.current = handle;
	};

	if (deviceId <= 0) {
		return (
			<Text size="sm" c="dimmed">
				Сохраните устройство, чтобы загружать изображения
			</Text>
		);
	}

	return (
		<Stack gap="md">
			{!readOnly ? (
				<Group>
					<FileButton
						multiple
						accept="image/*"
						onChange={(files) => {
							if (files && files.length > 0) {
								uploadMutation.mutate(files);
							}
						}}
					>
						{(props) => (
							<Button
								{...props}
								variant="light"
								leftSection={<IconUpload size={16} />}
								loading={uploadMutation.isPending}
							>
								Загрузить изображения
							</Button>
						)}
					</FileButton>
				</Group>
			) : null}

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет изображений
				</Text>
			) : (
				<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
					{entries.map((item, index) => (
						<Box
							key={item.id}
							style={{
								border: '1px solid var(--mantine-color-default-border)',
								borderRadius: 4,
								overflow: 'hidden',
							}}
						>
							<Box
								style={{ cursor: 'pointer' }}
								onClick={() => openGallery(index)}
							>
								<Image src={item.src} alt={item.name ?? ''} h={120} fit="cover" />
							</Box>
							<Group justify="space-between" px="xs" py={4} wrap="nowrap">
								<Text size="xs" lineClamp={1} style={{ flex: 1 }}>
									{item.name ?? `#${item.id}`}
								</Text>
								<Group gap={4} wrap="nowrap">
									<ActionIcon
										variant="subtle"
										size="sm"
										aria-label="Просмотр"
										onClick={() => openGallery(index)}
									>
										<IconEye size={14} />
									</ActionIcon>
									{!readOnly ? (
										<ActionIcon
											variant="subtle"
											color="red"
											size="sm"
											aria-label="Удалить"
											onClick={() => removeImage(item.id)}
										>
											<IconTrash size={14} />
										</ActionIcon>
									) : null}
								</Group>
							</Group>
						</Box>
					))}
				</SimpleGrid>
			)}

			{!readOnly && entries.length > 0 ? (
				<Text size="xs" c="dimmed">
					Удалённые изображения будут удалены с сервера после нажатия «Сохранить»
				</Text>
			) : null}
		</Stack>
	);
}

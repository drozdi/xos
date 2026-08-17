import { ActionIcon, Box, Group, Image, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import { useState } from 'react';

export interface DeviceGalleryImage {
	id: number;
	src: string;
	name?: string;
}

interface DeviceImageGalleryProps {
	images: DeviceGalleryImage[];
	initialIndex?: number;
	onClose: () => void;
}

export function DeviceImageGallery({ images, initialIndex = 0, onClose }: DeviceImageGalleryProps) {
	const [index, setIndex] = useState(() =>
		Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)),
	);

	if (images.length === 0) {
		return (
			<Box p="md">
				<Text c="dimmed">Нет изображений</Text>
			</Box>
		);
	}

	const current = images[index];
	const hasPrev = index > 0;
	const hasNext = index < images.length - 1;

	return (
		<StackGallery
			current={current}
			index={index}
			total={images.length}
			hasPrev={hasPrev}
			hasNext={hasNext}
			onPrev={() => setIndex((value) => Math.max(0, value - 1))}
			onNext={() => setIndex((value) => Math.min(images.length - 1, value + 1))}
			onClose={onClose}
		/>
	);
}

function StackGallery({
	current,
	index,
	total,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
	onClose,
}: {
	current: DeviceGalleryImage;
	index: number;
	total: number;
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	onClose: () => void;
}) {
	return (
		<Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
			<Group justify="space-between" px="sm" py="xs" style={{ flexShrink: 0 }}>
				<Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
					{current.name ?? `Изображение #${current.id}`}
				</Text>
				<Text size="xs" c="dimmed">
					{index + 1} / {total}
				</Text>
				<ActionIcon variant="subtle" aria-label="Закрыть" onClick={onClose}>
					<IconX size={16} />
				</ActionIcon>
			</Group>
			<Box
				style={{
					flex: 1,
					minHeight: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'var(--mantine-color-body)',
					position: 'relative',
				}}
			>
				{hasPrev ? (
					<ActionIcon
						variant="light"
						size="lg"
						aria-label="Предыдущее"
						onClick={onPrev}
						style={{ position: 'absolute', left: 8, zIndex: 1 }}
					>
						<IconChevronLeft size={20} />
					</ActionIcon>
				) : null}
				<Image
					src={current.src}
					alt={current.name ?? 'Изображение устройства'}
					fit="contain"
				 mah="100%"
				 maw="100%"
				/>
				{hasNext ? (
					<ActionIcon
						variant="light"
						size="lg"
						aria-label="Следующее"
						onClick={onNext}
						style={{ position: 'absolute', right: 8, zIndex: 1 }}
					>
						<IconChevronRight size={20} />
					</ActionIcon>
				) : null}
			</Box>
		</Box>
	);
}

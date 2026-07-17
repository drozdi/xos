import { Anchor, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';

interface EventDetailModalProps {
	classId: number;
	eventId: number | null;
	opened: boolean;
	onClose: () => void;
}

export function EventDetailModal({ classId, eventId, opened, onClose }: EventDetailModalProps) {
	const detailQuery = useQuery({
		queryKey: queryKeys.schooltask.studentEvent(classId, eventId ?? 0),
		queryFn: () => schooltaskCalendarApi.studentEventDetail(classId, eventId ?? 0),
		enabled: opened && eventId !== null && classId > 0,
	});

	return (
		<Modal opened={opened} onClose={onClose} title="Урок" size="lg" centered>
			{detailQuery.isLoading ? (
				<Group justify="center" py="md">
					<Loader size="sm" />
				</Group>
			) : detailQuery.data ? (
				<Stack gap="sm">
					{detailQuery.data.theme ? (
						<Text>
							<strong>Тема:</strong> {detailQuery.data.theme}
						</Text>
					) : null}
					{detailQuery.data.teacher ? (
						<Text>
							<strong>Учитель:</strong> {detailQuery.data.teacher}
						</Text>
					) : null}
					{detailQuery.data.email ? (
						<Text>
							<strong>Email:</strong> {detailQuery.data.email}
						</Text>
					) : null}
					{detailQuery.data.ht ? (
						<Stack gap={4}>
							<Text fw={600}>Домашнее задание</Text>
							<Text dangerouslySetInnerHTML={{ __html: detailQuery.data.ht }} />
						</Stack>
					) : null}
					{detailQuery.data.pt ? (
						<Stack gap={4}>
							<Text fw={600}>План урока</Text>
							<Text dangerouslySetInnerHTML={{ __html: detailQuery.data.pt }} />
						</Stack>
					) : null}
					{detailQuery.data.des ? (
						<Stack gap={4}>
							<Text fw={600}>Описание</Text>
							<Text>{detailQuery.data.des}</Text>
						</Stack>
					) : null}
					{detailQuery.data.net && detailQuery.data.net.length > 0 ? (
						<Stack gap={4}>
							<Text fw={600}>Ссылки</Text>
							{detailQuery.data.net.map((link) => (
								<Anchor key={link} href={link} target="_blank" rel="noreferrer">
									{link}
								</Anchor>
							))}
						</Stack>
					) : null}
					{detailQuery.data.files && Object.keys(detailQuery.data.files).length > 0 ? (
						<Stack gap={4}>
							<Text fw={600}>Файлы</Text>
							{Object.entries(detailQuery.data.files).map(([name, url]) => (
								<Anchor key={name} href={url} target="_blank" rel="noreferrer">
									{name}
								</Anchor>
							))}
						</Stack>
					) : null}
				</Stack>
			) : (
				<Text c="dimmed">Нет данных</Text>
			)}
		</Modal>
	);
}

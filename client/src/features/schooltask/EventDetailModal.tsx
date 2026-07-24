import { Flex, Modal, Spin, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';

interface EventDetailModalProps {
	classId: number;
	eventId: number | null;
	opened: boolean;
	onClose: () => void;
}

function formatLessonTitle(subject?: string | null, start?: string | null): string {
	const subjectLabel = subject?.trim() || 'Урок';
	if (!start) {
		return subjectLabel;
	}
	const dateLabel = dayjs(start).format('DD.MM.YYYY HH:mm');
	return `${subjectLabel} — ${dateLabel}`;
}

export function EventDetailModal({ classId, eventId, opened, onClose }: EventDetailModalProps) {
	const detailQuery = useQuery({
		queryKey: queryKeys.schooltask.studentEvent(classId, eventId ?? 0),
		queryFn: () => schooltaskCalendarApi.studentEventDetail(classId, eventId ?? 0),
		enabled: opened && eventId !== null && classId > 0,
	});

	const title = formatLessonTitle(detailQuery.data?.subject, detailQuery.data?.start);

	return (
		<Modal open={opened} onCancel={onClose} title={title} width={720} footer={null} centered destroyOnHidden>
			{detailQuery.isLoading ? (
				<Flex justify="center" style={{ padding: '16px 0' }}>
					<Spin size="small" />
				</Flex>
			) : detailQuery.data ? (
				<Flex vertical gap={12}>
					{detailQuery.data.teacher ? (
						<Typography.Text>
							<strong>Учитель:</strong> {detailQuery.data.teacher}
						</Typography.Text>
					) : null}
					{detailQuery.data.email ? (
						<Typography.Text>
							<strong>Email:</strong> {detailQuery.data.email}
						</Typography.Text>
					) : null}
					{detailQuery.data.theme ? (
						<Typography.Text>
							<strong>Тема:</strong> {detailQuery.data.theme}
						</Typography.Text>
					) : null}
					{detailQuery.data.ht ? (
						<Flex vertical gap={4}>
							<Typography.Text strong>Домашнее задание</Typography.Text>
							<div dangerouslySetInnerHTML={{ __html: detailQuery.data.ht }} />
						</Flex>
					) : null}
					{detailQuery.data.pt ? (
						<Flex vertical gap={4}>
							<Typography.Text strong>План урока</Typography.Text>
							<div dangerouslySetInnerHTML={{ __html: detailQuery.data.pt }} />
						</Flex>
					) : null}
					{detailQuery.data.des ? (
						<Flex vertical gap={4}>
							<Typography.Text strong>Описание</Typography.Text>
							<div dangerouslySetInnerHTML={{ __html: detailQuery.data.des }} />
						</Flex>
					) : null}
					{detailQuery.data.net && detailQuery.data.net.length > 0 ? (
						<Flex vertical gap={4}>
							<Typography.Text strong>Ссылки</Typography.Text>
							{detailQuery.data.net.map((link) => (
								<Typography.Link key={link} href={link} target="_blank" rel="noreferrer">
									{link}
								</Typography.Link>
							))}
						</Flex>
					) : null}
					{detailQuery.data.files && Object.keys(detailQuery.data.files).length > 0 ? (
						<Flex vertical gap={4}>
							<Typography.Text strong>Файлы</Typography.Text>
							{Object.entries(detailQuery.data.files).map(([name, url]) => (
								<Typography.Link key={name} href={url} target="_blank" rel="noreferrer">
									{name}
								</Typography.Link>
							))}
						</Flex>
					) : null}
				</Flex>
			) : (
				<Typography.Text type="secondary">Нет данных</Typography.Text>
			)}
		</Modal>
	);
}

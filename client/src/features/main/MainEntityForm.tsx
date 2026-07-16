import {
	Alert,
	Box,
	Button,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { useEntityId } from './mainAppUtils';

interface MainEntityFormProps<T> {
	title: string;
	queryKey: readonly unknown[];
	load: (id: number) => Promise<T>;
	save: (id: number, data: T) => Promise<number>;
	create: (data: T) => Promise<number>;
	children: (props: {
		data: T;
		setField: <K extends keyof T>(key: K, value: T[K]) => void;
		isNew: boolean;
	}) => ReactNode;
	initialData: T;
}

export function MainEntityForm<T extends Record<string, unknown>>({
	title,
	queryKey,
	load,
	save,
	create,
	children,
	initialData,
}: MainEntityFormProps<T>) {
	const entityId = useEntityId();
	const isNew = entityId === 0;
	const queryClient = useQueryClient();
	const [form, setForm] = useState<T>(initialData);

	useWindowTitle(isNew ? `${title} (новый)` : `${title} #${entityId}`);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: [...queryKey, entityId],
		queryFn: () => (isNew ? initialData : load(entityId)),
	});

	useEffect(() => {
		if (data) {
			setForm(data);
		}
	}, [data]);

	const mutation = useMutation({
		mutationFn: async () => {
			if (isNew) {
				return create({ ...form, id: 0 });
			}
			return save(entityId, form);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey });
		},
		onError: (err: unknown) => {
			const message = err instanceof Error ? err.message : 'Ошибка сохранения';
			notifications.show({ message, color: 'red' });
		},
	});

	if (isLoading) {
		return (
			<Group justify="center" py="xl">
				<Loader size="sm" />
			</Group>
		);
	}

	if (isError) {
		return (
			<Alert color="red" title="Ошибка" m="md">
				{error instanceof Error ? error.message : 'Не удалось загрузить'}
			</Alert>
		);
	}

	const setField = <K extends keyof T>(key: K, value: T[K]) => {
		setForm((current) => ({ ...current, [key]: value }));
	};

	return (
		<ScrollArea h="100%" p="md">
			<Stack gap="md">
				<Group justify="space-between">
					<Text fw={600}>{isNew ? `${title} — новый` : `${title} #${entityId}`}</Text>
					<Button size="xs" loading={mutation.isPending} onClick={() => mutation.mutate()}>
						Сохранить
					</Button>
				</Group>
				<Box>{children({ data: form, setField, isNew })}</Box>
			</Stack>
		</ScrollArea>
	);
}

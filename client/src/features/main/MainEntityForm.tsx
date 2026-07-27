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
import {
	extractApiErrorMessage,
	extractApiFieldErrors,
	notifyApiError,
} from '@/core/api/apiError';
import { confirmAction } from '@/core/confirm/confirmAction';
import { useAppContext } from '@/core/context/AppContext';
import { useWmStore } from '@/core/windowManager/useWmStore';

import { useEntityId } from './mainAppUtils';

interface MainEntityFormProps<T> {
	title: string;
	queryKey: readonly unknown[];
	listQueryKey?: readonly unknown[];
	invalidateQueryKeys?: readonly (readonly unknown[])[];
	load: (id: number) => Promise<T>;
	save: (id: number, data: T) => Promise<number>;
	create: (data: T) => Promise<number>;
	remove?: (id: number) => Promise<unknown>;
	children: (props: {
		data: T;
		setField: <K extends keyof T>(key: K, value: T[K]) => void;
		isNew: boolean;
		readOnly: boolean;
		errors: Partial<Record<keyof T & string, string>>;
	}) => ReactNode;
	headerNote?: (props: { data: T; isNew: boolean }) => ReactNode;
	initialData: T;
	buildNewData?: () => Promise<T>;
	validate?: (data: T) => Partial<Record<keyof T & string, string>>;
	transformBeforeSave?: (data: T) => T;
	canSave?: boolean;
	canDelete?: boolean;
}

export function MainEntityForm<T extends Record<string, unknown>>({
	title,
	queryKey,
	listQueryKey,
	invalidateQueryKeys,
	load,
	save,
	create,
	remove,
	children,
	headerNote,
	initialData,
	buildNewData,
	validate,
	transformBeforeSave,
	canSave = true,
	canDelete = false,
}: MainEntityFormProps<T>) {
	const { windowId } = useAppContext();
	const closeWindow = useWmStore((state) => state.closeWindow);
	const entityId = useEntityId();
	const isNew = entityId === 0;
	const queryClient = useQueryClient();
	const [form, setForm] = useState<T>(initialData);
	const [errors, setErrors] = useState<Partial<Record<keyof T & string, string>>>({});

	useWindowTitle(isNew ? `${title} (новый)` : `${title} #${entityId}`);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: [...queryKey, entityId],
		queryFn: () => (isNew ? (buildNewData?.() ?? Promise.resolve(initialData)) : load(entityId)),
	});

	useEffect(() => {
		if (data) {
			setForm(data);
		}
	}, [data]);

	const mutation = useMutation({
		mutationFn: async () => {
			if (validate) {
				const nextErrors = validate(form);
				if (Object.keys(nextErrors).length > 0) {
					setErrors(nextErrors);
					const firstMessage = Object.values(nextErrors).find(
						(value): value is string => typeof value === 'string' && value.length > 0,
					);
					throw new Error(firstMessage ?? 'Проверьте форму');
				}
			}
			setErrors({});
			const payload = transformBeforeSave ? transformBeforeSave(form) : form;
			if (isNew) {
				return create({ ...payload, id: 0 });
			}
			return save(entityId, payload);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey });
			if (listQueryKey) {
				void queryClient.invalidateQueries({ queryKey: listQueryKey });
			}
			for (const key of invalidateQueryKeys ?? []) {
				void queryClient.invalidateQueries({ queryKey: key });
			}
		},
		onError: (err: unknown) => {
			const fieldErrors = extractApiFieldErrors(err);
			if (Object.keys(fieldErrors).length > 0) {
				setErrors(fieldErrors as Partial<Record<keyof T & string, string>>);
			}
			notifyApiError(err, 'Ошибка сохранения');
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => {
			if (!remove) {
				throw new Error('Удаление недоступно');
			}
			return remove(entityId);
		},
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			if (listQueryKey) {
				void queryClient.invalidateQueries({ queryKey: listQueryKey });
			}
			closeWindow(windowId);
		},
		onError: (err: unknown) => {
			notifyApiError(err, 'Ошибка удаления');
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
				{extractApiErrorMessage(error, 'Не удалось загрузить')}
			</Alert>
		);
	}

	const setField = <K extends keyof T>(key: K, value: T[K]) => {
		setForm((current) => ({ ...current, [key]: value }));
		setErrors((current) => {
			if (!current[key as keyof T & string]) {
				return current;
			}
			const next = { ...current };
			delete next[key as keyof T & string];
			return next;
		});
	};

	const readOnly = !isNew && !canSave;

	return (
		<ScrollArea h="100%" p="md">
			<Stack gap="md">
				<Group justify="space-between" align="flex-start">
					<Stack gap={2}>
						<Text fw={600}>{isNew ? `${title} — новый` : `${title} #${entityId}`}</Text>
						{headerNote?.({ data: form, isNew })}
					</Stack>
					<Group gap="xs">
						{canDelete && !isNew && remove ? (
							<Button
								size="xs"
								color="red"
								variant="light"
								loading={deleteMutation.isPending}
								onClick={() => {
									confirmAction({
										title: 'Удаление',
										message: 'Удалить запись? Это действие нельзя отменить.',
										confirmLabel: 'Удалить',
										confirmColor: 'red',
										onConfirm: () => deleteMutation.mutate(),
									});
								}}
							>
								Удалить
							</Button>
						) : null}
						{canSave ? (
							<Button
								size="xs"
								loading={mutation.isPending}
								onClick={() => {
									if (isNew) {
										mutation.mutate();
										return;
									}
									confirmAction({
										title: 'Сохранение',
										message: 'Сохранить изменения?',
										confirmLabel: 'Сохранить',
										onConfirm: () => mutation.mutate(),
									});
								}}
							>
								Сохранить
							</Button>
						) : null}
					</Group>
				</Group>
				<Box>{children({ data: form, setField, isNew, readOnly, errors })}</Box>
			</Stack>
		</ScrollArea>
	);
}

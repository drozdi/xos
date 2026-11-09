import { Button, Group, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import type { OpsLink } from '@/core/api/endpoints/opsApi';
import { OpsScreen, useSaveLink } from '@/features/ops/OpsScreen';

type Draft = {
	name: string;
	driver: string;
	host: string;
	port: string;
	database_name: string;
	username: string;
	secret: string;
};

function emptyDraft(): Draft {
	return { name: '', driver: 'mysql', host: '', port: '3306', database_name: '', username: '', secret: '' };
}

function fromLink(link: OpsLink): Draft {
	return {
		name: link.name,
		driver: link.driver || 'mysql',
		host: link.host,
		port: String(link.port || 3306),
		database_name: link.database_name,
		username: link.username,
		secret: '',
	};
}

function DbEditor({ link, onClose }: { link: OpsLink | null; onClose: () => void }) {
	const [draft, setDraft] = useState<Draft>(link ? fromLink(link) : emptyDraft());
	const save = useSaveLink('db', onClose);
	const set = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

	return (
		<Stack>
			<TextInput label="Название" value={draft.name} onChange={(event) => set('name', event.currentTarget.value)} />
			<Select
				label="Драйвер"
				data={[
					{ value: 'mysql', label: 'MySQL' },
					{ value: 'pgsql', label: 'PostgreSQL' },
				]}
				value={draft.driver}
				onChange={(value) => set('driver', value ?? 'mysql')}
			/>
			<TextInput label="Хост" value={draft.host} onChange={(event) => set('host', event.currentTarget.value)} />
			<TextInput label="Порт" value={draft.port} onChange={(event) => set('port', event.currentTarget.value)} />
			<TextInput label="База" value={draft.database_name} onChange={(event) => set('database_name', event.currentTarget.value)} />
			<TextInput label="Пользователь" value={draft.username} onChange={(event) => set('username', event.currentTarget.value)} />
			<PasswordInput
				label="Пароль"
				placeholder={link?.has_secret ? 'Оставьте пустым, чтобы не менять' : ''}
				value={draft.secret}
				onChange={(event) => set('secret', event.currentTarget.value)}
			/>
			{save.isError ? <Text c="red" size="sm">{extractApiErrorMessage(save.error)}</Text> : null}
			<Group justify="flex-end">
				<Button
					loading={save.isPending}
					onClick={() =>
						save.mutate({
							id: link?.id ?? null,
							payload: {
								name: draft.name.trim(),
								driver: draft.driver,
								host: draft.host.trim(),
								port: Number(draft.port),
								database_name: draft.database_name.trim(),
								username: draft.username.trim(),
								...(draft.secret.trim() ? { secret: draft.secret } : {}),
							},
						})
					}
				>
					Сохранить
				</Button>
			</Group>
		</Stack>
	);
}

export function DbEditorHost({ link, onClose }: { link: OpsLink | null; onClose: () => void }) {
	return <DbEditor key={link?.id ?? 'new'} link={link} onClose={onClose} />;
}

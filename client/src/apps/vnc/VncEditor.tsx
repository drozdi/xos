import { Button, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import type { OpsLink } from '@/core/api/endpoints/opsApi';
import { useSaveLink } from '@/features/ops/OpsScreen';

export function VncEditor({ link, onClose }: { link: OpsLink | null; onClose: () => void }) {
	const [name, setName] = useState(link?.name ?? '');
	const [host, setHost] = useState(link?.host ?? '');
	const [port, setPort] = useState(String(link?.port || 5900));
	const [secret, setSecret] = useState('');
	const save = useSaveLink('vnc', onClose);

	return (
		<Stack>
			<TextInput label="Название" value={name} onChange={(event) => setName(event.currentTarget.value)} />
			<TextInput label="Хост" value={host} onChange={(event) => setHost(event.currentTarget.value)} />
			<TextInput label="Порт" value={port} onChange={(event) => setPort(event.currentTarget.value)} />
			<PasswordInput
				label="Пароль"
				description="Учитываются первые 8 символов"
				placeholder={link?.has_secret ? 'Оставьте пустым, чтобы не менять' : ''}
				value={secret}
				onChange={(event) => setSecret(event.currentTarget.value)}
			/>
			{save.isError ? <Text c="red" size="sm">{extractApiErrorMessage(save.error)}</Text> : null}
			<Group justify="flex-end">
				<Button
					loading={save.isPending}
					onClick={() =>
						save.mutate({
							id: link?.id ?? null,
							payload: {
								name: name.trim(),
								host: host.trim(),
								port: Number(port),
								...(secret.trim() ? { secret } : {}),
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

import { Button, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import type { OpsLink } from '@/core/api/endpoints/opsApi';
import { useSaveLink } from '@/features/ops/OpsScreen';

export function DockerEditor({ link, onClose }: { link: OpsLink | null; onClose: () => void }) {
	const [name, setName] = useState(link?.name ?? '');
	const [host, setHost] = useState(link?.host ?? '');
	const [secret, setSecret] = useState('');
	const save = useSaveLink('docker', onClose);

	return (
		<Stack>
			<TextInput label="Название" value={name} onChange={(event) => setName(event.currentTarget.value)} />
			<TextInput label="Адрес API" placeholder="https://203.0.113.10:2376" value={host} onChange={(event) => setHost(event.currentTarget.value)} />
			<PasswordInput
				label="Токен"
				placeholder={link?.has_secret ? 'Оставьте пустым, чтобы не менять' : 'Необязательно'}
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

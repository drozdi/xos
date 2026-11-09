import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { opsApi, type OpsLink } from '@/core/api/endpoints/opsApi';
import { SshHostKeyError } from '@/core/api/endpoints/sshApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { OpsScreen } from '@/features/ops/OpsScreen';

import { TunnelEditor } from './TunnelEditor';

function TunnelPane({ link }: { link: OpsLink }) {
	const queryClient = useQueryClient();
	const [error, setError] = useState<string | null>(null);
	const refresh = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.ops.links('tunnel') });
	};
	const start = useMutation({
		mutationFn: (accept: boolean) => opsApi.tunnelStart(link.id, accept),
		onSuccess: refresh,
		onError: (reason) => {
			if (reason instanceof SshHostKeyError) {
				confirmAction({
					title: 'Ключ сервера',
					message: `Отпечаток ${reason.fingerprint} не совпадает с сохранённым. Подключаться только если вы ожидали смену ключа.`,
					confirmLabel: 'Доверять',
					confirmColor: 'red',
					onConfirm: () => start.mutate(true),
				});
				return;
			}
			setError(extractApiErrorMessage(reason));
		},
	});
	const stop = useMutation({
		mutationFn: () => opsApi.tunnelStop(link.id),
		onSuccess: refresh,
	});

	return (
		<Stack gap="sm">
			<Group>
				<Text fw={600}>{link.name}</Text>
				<Badge color={link.running ? 'green' : 'gray'}>{link.running ? 'запущен' : 'остановлен'}</Badge>
			</Group>
			<Text size="sm">
				127.0.0.1:{link.listen_port} → {link.target_host}:{link.target_port}
			</Text>
			<Text size="xs" c="dimmed">
				Нужен ключ без парольной фразы. Порт открывается только на этом компьютере.
			</Text>
			<Group>
				<Button loading={start.isPending} onClick={() => { setError(null); start.mutate(false); }}>
					Запустить
				</Button>
				<Button variant="light" color="red" loading={stop.isPending} onClick={() => stop.mutate()}>
					Остановить
				</Button>
			</Group>
			{error ? <Text c="red" size="sm">{error}</Text> : null}
			{stop.isError ? <Text c="red" size="sm">{extractApiErrorMessage(stop.error)}</Text> : null}
		</Stack>
	);
}

export default function TunnelApp() {
	return (
		<OpsScreen
			title="Туннель"
			hint="Проброс порта через сохранённое подключение SSH."
			kind="tunnel"
			subtitle={(link) => `127.0.0.1:${link.listen_port} → ${link.target_host}:${link.target_port}`}
			editor={(link, close) => <TunnelEditor key={link?.id ?? 'new'} link={link} onClose={close} />}
			workspace={(link) => <TunnelPane key={link.id} link={link} />}
		/>
	);
}

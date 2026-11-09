import { Button, Group, Stack, Text } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { opsApi, type OpsLink } from '@/core/api/endpoints/opsApi';
import { OpsScreen } from '@/features/ops/OpsScreen';

import { VncEditor } from './VncEditor';

const KEYS: Record<string, number> = {
	Enter: 0xff0d,
	Backspace: 0xff08,
	Tab: 0xff09,
	Escape: 0xff1b,
	ArrowLeft: 0xff51,
	ArrowUp: 0xff52,
	ArrowRight: 0xff53,
	ArrowDown: 0xff54,
	Delete: 0xffff,
};

function Screen({ link }: { link: OpsLink }) {
	const [url, setUrl] = useState<string | null>(null);
	const [watch, setWatch] = useState(false);
	const frame = useMutation({
		mutationFn: (body: { x?: number; y?: number; button?: number; key?: number }) => opsApi.frame(link.id, body),
		onSuccess: (blob) => {
			setUrl((current) => {
				if (current) {
					URL.revokeObjectURL(current);
				}
				return URL.createObjectURL(blob);
			});
		},
	});

	useEffect(() => {
		frame.mutate({});
		return () => {
			setUrl((current) => {
				if (current) {
					URL.revokeObjectURL(current);
				}
				return null;
			});
		};
		// Open the screen once per connection.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [link.id]);

	const requestFrame = frame.mutate;
	useEffect(() => {
		if (!watch) {
			return;
		}
		const timer = window.setInterval(() => requestFrame({}), 2000);
		return () => window.clearInterval(timer);
	}, [watch, link.id, requestFrame]);

	return (
		<Stack gap="sm" h="100%">
			<Group justify="space-between">
				<Text fw={600}>{link.name}</Text>
				<Group gap="xs">
					<Button size="xs" variant="light" loading={frame.isPending} onClick={() => frame.mutate({})}>
						Обновить
					</Button>
					<Button size="xs" variant={watch ? 'filled' : 'light'} onClick={() => setWatch((value) => !value)}>
						Следить
					</Button>
				</Group>
			</Group>
			<Text size="xs" c="dimmed">
				{link.host}:{link.port}. Щелчок и клавиши уходят на сервер, затем приходит новый кадр.
			</Text>
			{frame.isError ? <Text c="red" size="sm">{extractApiErrorMessage(frame.error)}</Text> : null}
			{url ? (
				<img
					src={url}
					alt=""
					tabIndex={0}
					style={{ maxWidth: '100%', height: 'auto', background: '#111', cursor: 'crosshair' }}
					onMouseDown={(event) => event.currentTarget.focus()}
					onClick={(event) => {
						const rect = event.currentTarget.getBoundingClientRect();
						const scaleX = event.currentTarget.naturalWidth / rect.width;
						const scaleY = event.currentTarget.naturalHeight / rect.height;
						const button = event.button === 2 ? 4 : event.button === 1 ? 2 : 1;
						frame.mutate({
							x: Math.round((event.clientX - rect.left) * scaleX),
							y: Math.round((event.clientY - rect.top) * scaleY),
							button,
						});
					}}
					onKeyDown={(event) => {
						const key = KEYS[event.key] ?? (event.key.length === 1 ? event.key.charCodeAt(0) : 0);
						if (key < 1) {
							return;
						}
						event.preventDefault();
						frame.mutate({ key });
					}}
					onContextMenu={(event) => event.preventDefault()}
				/>
			) : null}
		</Stack>
	);
}

export default function VncApp() {
	return (
		<OpsScreen
			title="Стол"
			hint="Публичный адрес VNC."
			kind="vnc"
			subtitle={(link) => `${link.host}:${link.port}`}
			editor={(link, close) => <VncEditor key={link?.id ?? 'new'} link={link} onClose={close} />}
			workspace={(link) => <Screen key={link.id} link={link} />}
		/>
	);
}

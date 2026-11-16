import { Badge, Button, Group, PasswordInput, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { rdpApi, type RdpConnection, type RdpConnectionWrite } from '@/core/api/endpoints/rdpApi';

type Draft = RdpConnectionWrite;

const empty = (): Draft => ({
	name: '',
	host: '',
	port: 3389,
	zone: 'auto',
	username: '',
	domain: '',
	secret: '',
	security: 'nla',
	ignore_cert: false,
	width: 1280,
	height: 720,
	dpi: 96,
	color_depth: 16,
	enable_clipboard: true,
	enable_audio: false,
	enable_drive: false,
	keyboard_layout: 'en-us-qwerty',
	resize_method: 'reconnect',
});

function fromConnection(connection: RdpConnection): Draft {
	return {
		name: connection.name,
		host: connection.host,
		port: connection.port,
		zone: connection.zone,
		username: connection.username,
		domain: connection.domain,
		secret: '',
		security: connection.security,
		ignore_cert: connection.ignore_cert,
		width: connection.width,
		height: connection.height,
		dpi: connection.dpi,
		color_depth: connection.color_depth,
		enable_clipboard: connection.enable_clipboard,
		enable_audio: connection.enable_audio,
		enable_drive: connection.enable_drive,
		keyboard_layout: connection.keyboard_layout,
		resize_method: connection.resize_method,
	};
}

export function RdpEditor({
	connection,
	onClose,
	onSaved,
}: {
	connection: RdpConnection | null;
	onClose: () => void;
	onSaved: () => Promise<void>;
}) {
	const [draft, setDraft] = useState<Draft>(connection ? fromConnection(connection) : empty());
	const [hint, setHint] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

	return (
		<Stack gap="sm">
			<TextInput label="Название" value={draft.name} onChange={(event) => set('name', event.currentTarget.value)} />
			<Group grow align="flex-end">
				<TextInput
					label="Хост"
					value={draft.host}
					onChange={(event) => set('host', event.currentTarget.value)}
					onBlur={() => {
						const host = draft.host.trim();
						if (!host) {
							return;
						}
						void rdpApi.checkHost(host).then((result) => {
							if (!result.allowed) {
								setHint(result.reason);
								return;
							}
							setHint(result.zone === 'internal' ? `Внутренняя${result.network ? ` · ${result.network}` : ''}` : 'Интернет');
						}).catch((reason: unknown) => setHint(extractApiErrorMessage(reason)));
					}}
				/>
				<TextInput label="Порт" value={String(draft.port)} onChange={(event) => set('port', Number(event.currentTarget.value) || 3389)} />
			</Group>
			{hint ? <Text size="xs" c="dimmed">{hint}</Text> : null}
			<Select
				label="Зона"
				value={draft.zone}
				onChange={(value) => set('zone', value ?? 'auto')}
				data={[
					{ value: 'auto', label: 'Авто' },
					{ value: 'public', label: 'Интернет' },
					{ value: 'internal', label: 'Внутренняя' },
				]}
			/>
			<Group grow>
				<TextInput label="Пользователь" value={draft.username} onChange={(event) => set('username', event.currentTarget.value)} />
				<TextInput label="Домен" value={draft.domain ?? ''} onChange={(event) => set('domain', event.currentTarget.value)} />
			</Group>
			<PasswordInput
				label="Пароль"
				placeholder={connection?.has_secret ? 'Оставьте пустым, чтобы не менять' : undefined}
				value={draft.secret ?? ''}
				onChange={(event) => set('secret', event.currentTarget.value)}
			/>
			<Select
				label="Безопасность"
				value={draft.security}
				onChange={(value) => set('security', value ?? 'nla')}
				data={[
					{ value: 'any', label: 'Авто' },
					{ value: 'nla', label: 'NLA' },
					{ value: 'tls', label: 'TLS' },
					{ value: 'rdp', label: 'RDP' },
				]}
			/>
			<Select
				label="Разрешение"
				value={`${draft.width}x${draft.height}`}
				onChange={(value) => {
					const [width, height] = (value ?? '1280x720').split('x');
					set('width', Number(width ?? 1280));
					set('height', Number(height ?? 720));
				}}
				data={[
					{ value: '1280x720', label: '1280×720' },
					{ value: '1920x1080', label: '1920×1080' },
					{ value: '1024x768', label: '1024×768' },
				]}
			/>
			<Select
				label="Глубина цвета"
				value={String(draft.color_depth)}
				onChange={(value) => set('color_depth', Number(value ?? 16))}
				data={['8', '16', '24', '32']}
			/>
			<Select
				label="Раскладка"
				value={draft.keyboard_layout}
				onChange={(value) => set('keyboard_layout', value ?? 'en-us-qwerty')}
				data={[
					{ value: 'en-us-qwerty', label: 'English' },
					{ value: 'ru-ru-qwerty', label: 'Русская' },
				]}
			/>
			<Switch label="Игнорировать сертификат" checked={draft.ignore_cert} onChange={(event) => set('ignore_cert', event.currentTarget.checked)} />
			{draft.ignore_cert ? <Badge color="red">Сертификат сервера не проверяется</Badge> : null}
			<Switch label="Буфер обмена" checked={draft.enable_clipboard} onChange={(event) => set('enable_clipboard', event.currentTarget.checked)} />
			<Switch label="Звук" checked={draft.enable_audio} onChange={(event) => set('enable_audio', event.currentTarget.checked)} />
			{error ? <Text c="red" size="sm">{error}</Text> : null}
			<Group justify="flex-end">
				<Button variant="default" onClick={onClose}>Отмена</Button>
				<Button
					loading={pending}
					onClick={() => {
						setPending(true);
						setError(null);
						const payload = { ...draft, secret: draft.secret?.trim() ? draft.secret : undefined };
						const request = connection ? rdpApi.update(connection.id, payload) : rdpApi.create(payload);
						void request
							.then(async () => {
								await onSaved();
								onClose();
							})
							.catch((reason: unknown) => setError(extractApiErrorMessage(reason)))
							.finally(() => setPending(false));
					}}
				>
					Сохранить
				</Button>
			</Group>
		</Stack>
	);
}

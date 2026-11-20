import { Button, Group, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';

import { runCommand } from './domainCommand';

export function ConfigTab({ serverId }: { serverId: number }) {
	const [file, setFile] = useState('smb');
	const [text, setText] = useState('');
	const [note, setNote] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const load = async () => {
		setBusy(true);
		setNote(null);
		try {
			const result = await runCommand(serverId, 'conf.read', { file });
			setText(result ?? '');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const save = async () => {
		setBusy(true);
		setNote(null);
		try {
			const result = await runCommand(serverId, 'conf.write', { file, content: text });
			setNote(result || 'Сохранено');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	return (
		<Stack gap="sm">
			<SegmentedControl
				value={file}
				onChange={setFile}
				data={[
					{ value: 'smb', label: 'smb.conf' },
					{ value: 'shares', label: 'Файл шар' },
				]}
			/>
			<Text size="sm" c="dimmed">
				Пути берутся из agent.ini: smb_conf и shares_conf. После записи агент проверяет testparm и возвращает прежний файл, если проверка не прошла.
			</Text>
			<Textarea minRows={16} autosize maxRows={28} value={text} onChange={(event) => setText(event.currentTarget.value)} styles={{ input: { fontFamily: 'monospace' } }} />
			<Group>
				<Button variant="light" loading={busy} onClick={() => void load()}>
					Загрузить
				</Button>
				<Button loading={busy} onClick={() => void save()}>
					Сохранить
				</Button>
				<Button
					variant="light"
					loading={busy}
					onClick={() => {
						setBusy(true);
						setNote(null);
						void runCommand(serverId, 'smb.template', {})
							.then(async (result) => {
								setNote(result || 'smb.conf собран');
								if (file === 'smb') {
									setText((await runCommand(serverId, 'conf.read', { file: 'smb' })) ?? '');
								}
							})
							.catch((reason: unknown) => {
								setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
							})
							.finally(() => setBusy(false));
					}}
				>
					Собрать smb.conf
				</Button>
			</Group>
			{note ? <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{note}</Text> : null}
		</Stack>
	);
}

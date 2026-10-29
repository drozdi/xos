import { Box } from '@mantine/core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useEffect, useRef } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { sshApi, SshHostKeyError } from '@/core/api/endpoints/sshApi';

import '@xterm/xterm/css/xterm.css';

export function SshTerminal({
	connectionId,
	acceptHostKey,
	active,
	onHostKey,
	onSourceIp,
}: {
	connectionId: number;
	acceptHostKey: boolean;
	active: boolean;
	onHostKey: (fingerprint: string) => void;
	onSourceIp: (sourceIp: string | null) => void;
}) {
	const hostRef = useRef<HTMLDivElement>(null);
	const termRef = useRef<Terminal | null>(null);
	const onHostKeyRef = useRef(onHostKey);
	const onSourceIpRef = useRef(onSourceIp);
	onHostKeyRef.current = onHostKey;
	onSourceIpRef.current = onSourceIp;

	useEffect(() => {
		const host = hostRef.current;
		if (!host) {
			return;
		}

		const term = new Terminal({
			cursorBlink: true,
			fontFamily: 'Consolas, "Courier New", monospace',
			fontSize: 14,
			scrollback: 5000,
			theme: {
				background: '#111111',
				foreground: '#e8e8e8',
				cursor: '#e8e8e8',
			},
		});
		const fit = new FitAddon();
		term.open(host);
		term.loadAddon(fit);
		termRef.current = term;
		fit.fit();
		term.focus();

		const abort = new AbortController();
		let sessionId = '';
		let inputChain = Promise.resolve();
		let closed = false;

		const send = (data: string) => {
			if (!sessionId || closed) {
				return;
			}
			inputChain = inputChain
				.then(() => sshApi.sendInput(sessionId, data))
				.catch(() => undefined);
		};

		const disposable = term.onData(send);
		const observer = new ResizeObserver(() => {
			if (host.clientWidth > 0 && host.clientHeight > 0) {
				fit.fit();
			}
		});
		observer.observe(host);

		const fail = (message: string) => {
			term.writeln(`\r\n${message}`);
		};

		term.writeln('Подключение…');

		void (async () => {
			try {
				const session = await sshApi.openSession({
					connection_id: connectionId,
					accept_host_key: acceptHostKey,
					columns: term.cols || 80,
					rows: term.rows || 24,
				});
				if (abort.signal.aborted) {
					await sshApi.close(session.id).catch(() => undefined);
					return;
				}
				sessionId = session.id;
				onSourceIpRef.current(session.source_ip);
				const response = await fetch(sshApi.streamUrl(session.id), {
					headers: sshApi.streamHeaders(),
					signal: abort.signal,
				});
				if (!response.ok || !response.body) {
					fail(`Не удалось открыть сессию (${response.status})`);
					return;
				}
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				while (!abort.signal.aborted) {
					const chunk = await reader.read();
					if (chunk.done) {
						break;
					}
					term.write(decoder.decode(chunk.value, { stream: true }));
				}
				if (!abort.signal.aborted) {
					fail('Соединение закрыто');
				}
			} catch (error) {
				if (abort.signal.aborted) {
					return;
				}
				if (error instanceof SshHostKeyError) {
					term.writeln(`\r\nКлюч сервера изменился: ${error.fingerprint}`);
					onHostKeyRef.current(error.fingerprint);
					return;
				}
				fail(extractApiErrorMessage(error, 'Не удалось подключиться'));
			}
		})();

		return () => {
			closed = true;
			abort.abort();
			disposable.dispose();
			observer.disconnect();
			termRef.current = null;
			term.dispose();
			if (sessionId) {
				void sshApi.close(sessionId).catch(() => undefined);
			}
		};
	}, [acceptHostKey, connectionId]);

	useEffect(() => {
		if (active) {
			termRef.current?.focus();
		}
	}, [active]);

	return (
		<Box
			style={{
				display: active ? 'flex' : 'none',
				position: 'absolute',
				inset: 0,
				flexDirection: 'column',
				minWidth: 0,
			}}
		>
			<Box ref={hostRef} style={{ flex: 1, minHeight: 0, background: '#111111', padding: 4 }} />
		</Box>
	);
}

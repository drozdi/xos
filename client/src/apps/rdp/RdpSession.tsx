import { Box, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { rdpApi } from '@/core/api/endpoints/rdpApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

export function RdpSession({ connectionId, title }: { connectionId: number; title: string }) {
	useWindowTitle(title);
	const hostRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) {
			return;
		}
		let stopped = false;
		let client: { disconnect: () => void } | null = null;
		let keyboard: {
			onkeydown: ((keysym: number) => boolean | void) | null;
			onkeyup: ((keysym: number) => void) | null;
			reset: () => void;
		} | null = null;

		void (async () => {
			try {
				const ticket = await rdpApi.ticket(connectionId);
				if (stopped) {
					return;
				}
				if (!ticket.gateway_url) {
					setError('Шлюз не настроен');
					return;
				}
				const Guacamole = (await import('guacamole-common-js')).default;
				if (stopped) {
					return;
				}
				const separator = ticket.gateway_url.includes('?') ? '&' : '?';
				const tunnel = new Guacamole.WebSocketTunnel(
					`${ticket.gateway_url}${separator}ticket=${encodeURIComponent(ticket.ticket)}`,
				);
				const display = new Guacamole.Client(tunnel);
				client = display;
				host.replaceChildren(display.getDisplay().getElement());
				const mouse = new Guacamole.Mouse(display.getDisplay().getElement());
				const sendMouse = (state: unknown) => display.sendMouseState(state);
				mouse.onmousedown = sendMouse;
				mouse.onmouseup = sendMouse;
				mouse.onmousemove = sendMouse;
				const keys = new Guacamole.Keyboard(document);
				keyboard = keys;
				keys.onkeydown = (keysym) => {
					display.sendKeyEvent(1, keysym);
				};
				keys.onkeyup = (keysym) => display.sendKeyEvent(0, keysym);
				display.onerror = (status) => setError(status.message || 'Сессия прервана');
				display.connect();
			} catch (reason) {
				if (!stopped) {
					setError(extractApiErrorMessage(reason, 'Не удалось открыть рабочий стол'));
				}
			}
		})();

		return () => {
			stopped = true;
			client?.disconnect();
			if (keyboard) {
				keyboard.onkeydown = null;
				keyboard.onkeyup = null;
				keyboard.reset();
			}
		};
	}, [connectionId]);

	return (
		<Box style={{ position: 'absolute', inset: 0, background: '#111', overflow: 'hidden' }}>
			<div ref={hostRef} style={{ width: '100%', height: '100%' }} />
			{error ? (
				<Text c="red" size="sm" p="md" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#111' }}>
					{error}
				</Text>
			) : null}
		</Box>
	);
}

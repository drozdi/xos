import { Client } from 'ssh2';
import { WebSocketServer } from 'ws';

const port = Number(process.env.SSH_GATEWAY_PORT ?? 7681);
const api = (process.env.SSH_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const secret = process.env.SSH_GATEWAY_SECRET ?? '';
const allowedOrigins = (process.env.SSH_GATEWAY_ORIGINS ?? '')
	.split(',')
	.map((item) => item.trim())
	.filter((item) => item !== '');
const idleMs = 5 * 60 * 1000;

const sockets = new WebSocketServer({
	port,
	maxPayload: 64 * 1024,
	verifyClient: ({ origin }) => allowedOrigins.length === 0 || allowedOrigins.includes(origin),
});

sockets.on('connection', (socket) => {
	let client = null;
	let userId = null;
	let idle = setTimeout(() => socket.close(), idleMs);
	const bumpIdle = () => {
		clearTimeout(idle);
		idle = setTimeout(() => socket.close(), idleMs);
	};

	socket.once('message', async (raw) => {
		bumpIdle();
		try {
			const hello = JSON.parse(String(raw));
			const response = await fetch(`${api}/api/ssh/gateway/redeem`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Gateway-Secret': secret,
				},
				body: JSON.stringify({ ticket: hello.ticket }),
			});
			if (!response.ok) {
				socket.send(`\r\nНе удалось открыть билет (${response.status})\r\n`);
				socket.close();
				return;
			}
			const creds = await response.json();
			userId = creds.user_id ?? null;
			client = new Client();
			client.on('ready', () => {
				client.shell({ cols: hello.columns ?? 80, rows: hello.rows ?? 24 }, (error, stream) => {
					if (error || !stream) {
						socket.close();
						return;
					}
					stream.on('data', (chunk) => socket.send(chunk.toString('utf8')));
					socket.on('message', (message) => {
						bumpIdle();
						stream.write(String(message));
					});
					socket.on('close', () => stream.end());
				});
			});
			client.on('error', (error) => {
				socket.send(`\r\n${error.message}\r\n`);
				socket.close();
			});
			client.connect({
				host: creds.host,
				port: creds.port,
				username: creds.username,
				password: creds.password ?? undefined,
				privateKey: creds.private_key ?? undefined,
				passphrase: creds.passphrase ?? undefined,
				readyTimeout: 10000,
			});
		} catch (error) {
			socket.send(`\r\n${error instanceof Error ? error.message : 'Ошибка шлюза'}\r\n`);
			socket.close();
		}
	});

	socket.on('close', () => {
		clearTimeout(idle);
		client?.end();
		if (userId) {
			void fetch(`${api}/api/ssh/gateway/release`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Gateway-Secret': secret,
				},
				body: JSON.stringify({ user_id: userId }),
			}).catch(() => undefined);
		}
	});
});

console.log(`ssh gateway listening on ${port}`);

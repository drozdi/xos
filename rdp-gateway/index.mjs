import net from 'node:net';
import { WebSocketServer } from 'ws';

const port = Number(process.env.RDP_GATEWAY_PORT ?? 7682);
const api = (process.env.RDP_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const secret = process.env.RDP_GATEWAY_SECRET ?? '';
const allowedOrigins = (process.env.RDP_GATEWAY_ORIGINS ?? '')
	.split(',')
	.map((item) => item.trim())
	.filter((item) => item !== '');
const idleMs = 15 * 60 * 1000;
const deny = ['0.0.0.0/8', '127.0.0.0/8', '169.254.0.0/16', '::1/128'];

const sockets = new WebSocketServer({
	port,
	maxPayload: 8 * 1024 * 1024,
	verifyClient: ({ origin }) => allowedOrigins.length === 0 || allowedOrigins.includes(origin),
});

sockets.on('connection', (socket, request) => {
	const ticket = new URL(request.url ?? '/', 'http://gateway').searchParams.get('ticket') ?? '';
	const state = {
		guacd: null,
		creds: null,
		userId: null,
		connectionId: null,
		argNames: null,
		heldConnect: null,
		clientBuffer: '',
		serverBuffer: '',
		pending: [],
		released: false,
	};
	const idle = { timer: setTimeout(() => socket.close(), idleMs) };
	const bump = () => {
		clearTimeout(idle.timer);
		idle.timer = setTimeout(() => socket.close(), idleMs);
	};
	const release = () => {
		if (state.released || state.userId === null) {
			state.released = true;
			return;
		}
		state.released = true;
		fetch(`${api}/api/rdp/gateway/release`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Gateway-Secret': secret },
			body: JSON.stringify({ user_id: state.userId, connection_id: state.connectionId }),
		}).catch(() => undefined);
	};

	const accept = (text) => {
		state.clientBuffer += text;
		state.clientBuffer = drain(state.clientBuffer, (elements) => {
			if (!state.guacd) {
				return;
			}
			if (elements[0] === 'connect') {
				if (!state.argNames) {
					state.heldConnect = elements;
					return;
				}
				state.guacd.write(connectInstruction(elements, state.argNames, state.creds));
				return;
			}
			state.guacd.write(encode(elements));
		});
	};

	socket.on('message', (message) => {
		bump();
		const text = message.toString();
		if (!state.guacd) {
			state.pending.push(text);
			return;
		}
		accept(text);
	});
	socket.on('close', () => {
		clearTimeout(idle.timer);
		state.guacd?.destroy();
		release();
	});

		void open(ticket, socket, state, bump, accept);
});

async function open(ticket, socket, state, bump, accept) {
	try {
		const response = await fetch(`${api}/api/rdp/gateway/redeem`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Gateway-Secret': secret },
			body: JSON.stringify({ ticket }),
		});
		if (!response.ok) {
			socket.close();
			return;
		}
		const creds = await response.json();
		if (isDenied(String(creds.resolved_ip ?? '')) || (creds.node?.tls && creds.node.tls !== 'none')) {
			socket.close();
			return;
		}
		state.creds = creds;
		state.userId = creds.user_id ?? null;
		state.connectionId = creds.connection_id ?? null;
		const node = creds.node ?? {};
		const guacd = net.connect(Number(node.port ?? 4822), String(node.host ?? '127.0.0.1'));
		state.guacd = guacd;
		for (const chunk of state.pending) {
			accept(chunk);
		}
		state.pending = [];
		guacd.on('data', (chunk) => {
			bump();
			const text = chunk.toString('utf8');
			socket.send(text);
			state.serverBuffer += text;
			state.serverBuffer = drain(state.serverBuffer, (elements) => {
				if (elements[0] !== 'args') {
					return;
				}
				state.argNames = elements.slice(1);
				if (state.heldConnect) {
					const held = state.heldConnect;
					state.heldConnect = null;
					guacd.write(connectInstruction(held, state.argNames, state.creds));
				}
			});
		});
		guacd.on('error', () => socket.close());
		guacd.on('close', () => socket.close());
	} catch {
		socket.close();
	}
}

function connectInstruction(elements, argNames, creds) {
	const provided = elements.slice(1);
	const values = argNames.map((name, index) => forced(name, creds) ?? provided[index] ?? '');
	return encode(['connect', ...values]);
}

function forced(name, creds) {
	if (!creds) {
		return null;
	}
	const map = {
		hostname: String(creds.resolved_ip ?? ''),
		port: String(creds.port ?? ''),
		username: String(creds.username ?? ''),
		password: String(creds.password ?? ''),
		domain: String(creds.domain ?? ''),
		security: String(creds.security ?? 'nla'),
		'ignore-cert': creds.ignore_cert ? 'true' : 'false',
		'color-depth': String(creds.color_depth ?? 16),
		'enable-audio': creds.enable_audio ? 'true' : 'false',
		'disable-audio': creds.enable_audio ? 'false' : 'true',
		'disable-copy': creds.enable_clipboard ? 'false' : 'true',
		'disable-paste': creds.enable_clipboard ? 'false' : 'true',
		'server-layout': String(creds.keyboard_layout ?? ''),
		'resize-method': Number(creds.width) > 0 ? 'reconnect' : String(creds.resize_method ?? 'reconnect'),
	};
	if (Number(creds.width) > 0 && (name === 'width' || name === 'height' || name === 'dpi')) {
		return String(creds[name] ?? '');
	}
	return Object.prototype.hasOwnProperty.call(map, name) ? map[name] : null;
}

function drain(buffer, onInstruction) {
	let rest = buffer;
	while (rest !== '') {
		const parsed = parseInstruction(rest);
		if (!parsed) {
			return rest;
		}
		onInstruction(parsed.elements);
		rest = parsed.rest;
	}
	return '';
}

function parseInstruction(buffer) {
	const elements = [];
	let index = 0;
	while (index < buffer.length) {
		const dot = buffer.indexOf('.', index);
		if (dot < 0) {
			return null;
		}
		const lengthText = buffer.slice(index, dot);
		if (!/^\d+$/.test(lengthText)) {
			return null;
		}
		const length = Number(lengthText);
		const start = dot + 1;
		if (buffer.length < start + length + 1) {
			return null;
		}
		const separator = buffer[start + length];
		if (separator !== ',' && separator !== ';') {
			return null;
		}
		elements.push(buffer.slice(start, start + length));
		index = start + length + 1;
		if (separator === ';') {
			return { elements, rest: buffer.slice(index) };
		}
	}
	return null;
}

function encode(elements) {
	return `${elements.map((item) => `${Array.from(item).length}.${item}`).join(',')};`;
}

function isDenied(ip) {
	return deny.some((cidr) => contains(cidr, ip));
}

function contains(cidr, ip) {
	const [network, prefixText] = cidr.split('/');
	const prefix = Number(prefixText);
	if (ip.includes(':') || network.includes(':')) {
		return ip === network;
	}
	const left = ip.split('.').reduce((sum, part) => (sum << 8) + Number(part), 0) >>> 0;
	const right = network.split('.').reduce((sum, part) => (sum << 8) + Number(part), 0) >>> 0;
	const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
	return (left & mask) === (right & mask);
}

console.log(`rdp-gateway listening on ${port}`);

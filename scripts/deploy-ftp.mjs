// Сборка клиента и выгрузка путей по FTP.
//   npm run deploy
//   node scripts/deploy-ftp.mjs client/public
// Настройки и список папок: deploy.ftp.json

import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
	console.error(message);
	process.exit(1);
}

function run(command, args, cwd) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
		child.on('error', reject);
		child.on('exit', (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new Error(`${command} ${args.join(' ')} завершилась с кодом ${code}`));
		});
	});
}

class Ftp {
	#socket;
	#buffer = '';
	#lines = [];
	#replies = [];
	#waiting = null;

	connect(host, port) {
		return new Promise((resolve, reject) => {
			this.#socket = net.connect(port, host, () => resolve());
			this.#socket.setEncoding('utf8');
			this.#socket.on('data', (chunk) => this.#onData(chunk));
			this.#socket.on('error', (error) => {
				if (this.#waiting) {
					this.#waiting.reject(error);
					this.#waiting = null;
				}
				reject(error);
			});
		}).then(() => this.#next());
	}

	#onData(chunk) {
		this.#buffer += chunk;
		while (true) {
			const end = this.#buffer.indexOf('\r\n');
			if (end < 0) {
				return;
			}
			const line = this.#buffer.slice(0, end);
			this.#buffer = this.#buffer.slice(end + 2);
			this.#lines.push(line);
			if (/^\d{3} /.test(line)) {
				const text = this.#lines.join('\n');
				this.#lines = [];
				this.#replies.push({ code: Number(line.slice(0, 3)), text });
				if (this.#waiting) {
					const pending = this.#waiting;
					this.#waiting = null;
					pending.resolve(this.#replies.shift());
				}
			}
		}
	}

	#next() {
		if (this.#replies.length > 0) {
			return Promise.resolve(this.#replies.shift());
		}
		return new Promise((resolve, reject) => {
			this.#waiting = { resolve, reject };
		});
	}

	async command(line) {
		this.#socket.write(`${line}\r\n`);
		const reply = await this.#next();
		if (reply.code >= 400) {
			throw new Error(reply.text);
		}
		return reply;
	}

	async mkdir(remoteDir) {
		this.#socket.write(`MKD ${remoteDir}\r\n`);
		const reply = await this.#next();
		if (reply.code >= 400 && reply.code !== 550) {
			throw new Error(reply.text);
		}
	}

	async upload(remoteFile, localFile) {
		const passive = await this.command('PASV');
		const match = passive.text.match(/(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/);
		if (!match) {
			throw new Error(passive.text);
		}
		const dataHost = match.slice(1, 5).join('.');
		const dataPort = Number(match[5]) * 256 + Number(match[6]);
		const data = net.connect(dataPort, dataHost);
		await new Promise((resolve, reject) => {
			data.once('connect', resolve);
			data.once('error', reject);
		});
		const started = this.command(`STOR ${remoteFile}`);
		await pipeline(createReadStream(localFile), data);
		await started;
		const done = await this.#next();
		if (done.code >= 400) {
			throw new Error(done.text);
		}
	}

	close() {
		this.#socket.end('QUIT\r\n');
	}
}

async function filesIn(target) {
	const stat = await fs.stat(target);
	if (!stat.isDirectory()) {
		return [target];
	}
	const found = [];
	const stack = [target];
	while (stack.length > 0) {
		const dir = stack.pop();
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile()) {
				found.push(full);
			}
		}
	}
	return found;
}

const configPath = path.join(root, 'deploy.ftp.json');
let config;
try {
	config = JSON.parse(await fs.readFile(configPath, 'utf8'));
} catch {
	fail('Нет deploy.ftp.json. Скопируйте deploy.ftp.example.json и заполните доступ.');
}

const host = String(config.host ?? '');
const user = String(config.user ?? '');
const password = String(config.password ?? '');
const remoteRoot = String(config.remote ?? '').trim().replace(/\/+$/, '');
const port = Number(config.port || 21);
const paths = process.argv.slice(2).filter((item) => item !== '');
const selected = paths.length > 0 ? paths : (Array.isArray(config.paths) ? config.paths.map(String) : []);

if (host === '' || user === '' || remoteRoot === '') {
	fail('В deploy.ftp.json нужны host, user и remote.');
}
if (config.ssl) {
	fail('Включен ssl. Этот скрипт ходит по обычному FTP.');
}
if (config.passive === false) {
	fail('Нужен passive: true.');
}
if (selected.length === 0) {
	fail('Укажите пути аргументами или полем paths в deploy.ftp.json.');
}

console.log('Сборка клиента');
await run('npm', ['run', 'build:ignore'], path.join(root, 'client'));

const files = [];
for (const item of selected) {
	const full = path.resolve(root, item);
	try {
		files.push(...await filesIn(full));
	} catch {
		fail(`Не найдено: ${item}`);
	}
}

const ftp = new Ftp();
const greeting = await ftp.connect(host, port);
if (greeting.code >= 400) {
	fail(greeting.text);
}
await ftp.command(`USER ${user}`);
await ftp.command(`PASS ${password}`);
await ftp.command('TYPE I');

const made = new Set();
async function ensureDir(remoteDir) {
	const parts = remoteDir.split('/').filter((part) => part !== '');
	let current = '';
	for (const part of parts) {
		current += `/${part}`;
		if (made.has(current)) {
			continue;
		}
		await ftp.mkdir(current);
		made.add(current);
	}
}

console.log(`Выгрузка ${files.length} файлов на ${host}`);
for (const file of files) {
	const relative = path.relative(root, file).split(path.sep).join('/');
	const remoteFile = `${remoteRoot}/${relative}`;
	await ensureDir(remoteFile.slice(0, remoteFile.lastIndexOf('/')));
	await ftp.upload(remoteFile, file);
	console.log(`  ${relative}`);
}

ftp.close();
console.log('Готово');

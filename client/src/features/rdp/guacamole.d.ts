declare module 'guacamole-common-js' {
	export class Status {
		code: number;
		message: string;
	}

	export class Client {
		constructor(tunnel: WebSocketTunnel);
		connect(data?: string): void;
		disconnect(): void;
		getDisplay(): { getElement(): HTMLElement };
		sendMouseState(state: unknown): void;
		sendKeyEvent(pressed: 0 | 1, keysym: number): void;
		onerror: ((status: Status) => void) | null;
	}

	export class WebSocketTunnel {
		constructor(url: string);
	}

	export class Mouse {
		constructor(element: HTMLElement);
		onmousedown: ((state: unknown) => void) | null;
		onmouseup: ((state: unknown) => void) | null;
		onmousemove: ((state: unknown) => void) | null;
	}

	export class Keyboard {
		constructor(element: Document | HTMLElement);
		onkeydown: ((keysym: number) => boolean | void) | null;
		onkeyup: ((keysym: number) => void) | null;
		reset(): void;
	}

	const Guacamole: {
		Client: typeof Client;
		WebSocketTunnel: typeof WebSocketTunnel;
		Mouse: typeof Mouse;
		Keyboard: typeof Keyboard;
	};

	export default Guacamole;
}

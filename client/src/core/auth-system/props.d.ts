interface RequestAuthLogin {
	login: string;
	password: string;
}
interface ResponseAuthLogin {
	token: string;
	refresh_token: string;
}

interface AuthStoreValue {
	isAuth: boolean;
	loading: boolean;
	user?: string;
	init(): void;
	login(val: { login: string; password: string }): void;
	logout(): void;
	load(): void;
}

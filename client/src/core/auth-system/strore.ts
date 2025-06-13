import { create } from 'zustand';
interface authStoreProps {
	isAuth: boolean;
	login(val: { login: string; password: string }): void;
}

const API_BASE_URL = 'http://xos';

export const useAuthSystem = create<authStoreProps>((set, get) => ({
	isAuth: false,
	async login({ login, password }) {
		console.log('login', login);
		console.log('password', password);
		const response = await fetch(`${API_BASE_URL}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			mode: 'cors',
			credentials: 'include',
			body: JSON.stringify({ login, password }),
		});
		console.log('response', response);
		return response.json();
	},
}));

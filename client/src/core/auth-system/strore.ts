import axios from 'axios';
import { create } from 'zustand';

interface authStoreProps {
	isAuth: boolean;
	user?: string;
	login(val: { login: string; password: string }): void;
}

const API_BASE_URL = 'http://localhost:8000';

export const useAuthSystem = create<authStoreProps>((set, get) => ({
	isAuth: false,
	user: '',
	async login({ login, password }) {
		console.log('login', login);
		console.log('password', password);
		const response = await axios
			.post(`${API_BASE_URL}/api/login`, {
				username: login,
				password: password,
			})
			.then((response) => {
				if (response.status === 200) {
					set({ isAuth: true, user: response.data.user });
				}
				return response;
			});
		//console.log('response', response);
	},
	async logout () {
		
	}


}));

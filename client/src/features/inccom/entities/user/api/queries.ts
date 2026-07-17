import { useMutation, useQuery } from '@tanstack/react-query';
import {
	mapAuthMeToUser,
	requestAuthMe,
	requestAuthRegister,
} from './auth';
import type { IRegisterRequest } from '../model/types';

const AUTH_ME_KEY = 'auth-me';

export function useAuthMeQuery(enabled = true) {
	return useQuery({
		queryKey: [AUTH_ME_KEY],
		queryFn: async () => {
			const data = await requestAuthMe();
			return mapAuthMeToUser(data);
		},
		enabled,
	});
}

export function useRegisterMutation() {
	return useMutation({
		mutationFn: (data: IRegisterRequest) => requestAuthRegister(data),
	});
}

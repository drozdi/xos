import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	deleteGithubCredentials,
	getGithubIssue,
	listGithubIssues,
	requestGithubCredentials,
	saveGithubCredentials,
	testGithubConnection,
	updateGithubIssue,
	type GithubCredentialsWrite,
	type GithubIssueUpdate,
} from './githubApi';

const CREDENTIALS_KEY = ['github', 'credentials'] as const;

export function useGithubCredentialsQuery() {
	return useQuery({
		queryKey: CREDENTIALS_KEY,
		queryFn: requestGithubCredentials,
	});
}

export function useGithubCredentialsSave() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: GithubCredentialsWrite) => saveGithubCredentials(data),
		onSuccess: (data) => {
			queryClient.setQueryData(CREDENTIALS_KEY, data);
		},
	});
}

export function useGithubCredentialsDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deleteGithubCredentials(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: CREDENTIALS_KEY });
		},
	});
}

export function useGithubConnectionTest() {
	return useMutation({
		mutationFn: () => testGithubConnection(),
	});
}

export function useGithubIssuesQuery(
	owner: string | null,
	repo: string | null,
	state: string,
	enabled: boolean,
) {
	return useQuery({
		queryKey: ['github', 'issues', owner, repo, state],
		queryFn: () =>
			listGithubIssues({
				owner: owner || undefined,
				repo: repo || undefined,
				state,
				per_page: 50,
			}),
		enabled: enabled && Boolean(owner) && Boolean(repo),
	});
}

export function useGithubIssueQuery(
	number: number | null,
	owner: string | null,
	repo: string | null,
	enabled: boolean,
) {
	return useQuery({
		queryKey: ['github', 'issue', owner, repo, number],
		queryFn: () =>
			getGithubIssue(number!, {
				owner: owner || undefined,
				repo: repo || undefined,
			}),
		enabled: enabled && Boolean(number) && Boolean(owner) && Boolean(repo),
	});
}

export function useGithubIssueUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			number,
			payload,
		}: {
			number: number;
			payload: GithubIssueUpdate;
		}) => updateGithubIssue(number, payload),
		onSuccess: (_data, vars) => {
			void queryClient.invalidateQueries({ queryKey: ['github', 'issues'] });
			void queryClient.invalidateQueries({
				queryKey: ['github', 'issue', vars.payload.owner, vars.payload.repo, vars.number],
			});
		},
	});
}

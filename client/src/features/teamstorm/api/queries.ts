import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	deleteTsCredentials,
	getTsWorkitem,
	listTsWorkitems,
	listTsWorkspaces,
	requestTsCredentials,
	saveTsCredentials,
	testTsConnection,
	updateTsWorkitem,
	type TsCredentialsWrite,
	type TsWorkitemUpdate,
} from './tsApi';

const CREDENTIALS_KEY = ['ts', 'credentials'] as const;

export function useTsCredentialsQuery() {
	return useQuery({
		queryKey: CREDENTIALS_KEY,
		queryFn: requestTsCredentials,
	});
}

export function useTsCredentialsSave() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: TsCredentialsWrite) => saveTsCredentials(data),
		onSuccess: (data) => {
			queryClient.setQueryData(CREDENTIALS_KEY, data);
		},
	});
}

export function useTsCredentialsDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deleteTsCredentials(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: CREDENTIALS_KEY });
		},
	});
}

export function useTsConnectionTest() {
	return useMutation({
		mutationFn: () => testTsConnection(),
	});
}

export function useTsWorkspacesQuery(enabled: boolean) {
	return useQuery({
		queryKey: ['ts', 'workspaces'],
		queryFn: listTsWorkspaces,
		enabled,
	});
}

export function useTsWorkitemsQuery(
	workspace: string | null,
	fromToken: string | null,
	mine: boolean,
	enabled: boolean,
) {
	return useQuery({
		queryKey: ['ts', 'workitems', workspace, fromToken, mine],
		queryFn: () =>
			listTsWorkitems(workspace!, {
				maxItemsCount: 50,
				fromToken,
				mine,
			}),
		enabled: enabled && Boolean(workspace),
	});
}

export function useTsWorkitemQuery(
	workspace: string | null,
	workitem: string | null,
	enabled: boolean,
) {
	return useQuery({
		queryKey: ['ts', 'workitem', workspace, workitem],
		queryFn: () => getTsWorkitem(workspace!, workitem!),
		enabled: enabled && Boolean(workspace) && Boolean(workitem),
	});
}

export function useTsWorkitemUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			workspace,
			workitem,
			payload,
		}: {
			workspace: string;
			workitem: string;
			payload: TsWorkitemUpdate;
		}) => updateTsWorkitem(workspace, workitem, payload),
		onSuccess: (_data, vars) => {
			void queryClient.invalidateQueries({ queryKey: ['ts', 'workitems', vars.workspace] });
			void queryClient.invalidateQueries({
				queryKey: ['ts', 'workitem', vars.workspace, vars.workitem],
			});
		},
	});
}

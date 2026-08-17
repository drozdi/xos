import type { QueryClient } from '@tanstack/react-query';

/** Invalidate explorer list caches for folder paths (any sort). */
export async function invalidateExplorerPaths(
	queryClient: QueryClient,
	paths: string[],
): Promise<void> {
	const unique = [...new Set(paths.filter(Boolean))];
	await Promise.all(
		unique.map((path) =>
			queryClient.invalidateQueries({
				queryKey: ['explorer', 'list', path],
			}),
		),
	);
}

export async function invalidateExplorerTree(queryClient: QueryClient): Promise<void> {
	await queryClient.invalidateQueries({ queryKey: ['explorer', 'tree'] });
}

export async function invalidateExplorerFolder(
	queryClient: QueryClient,
	...paths: string[]
): Promise<void> {
	await invalidateExplorerPaths(queryClient, paths);
	await invalidateExplorerTree(queryClient);
}

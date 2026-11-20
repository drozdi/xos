import { sambaApi } from '@/core/api/endpoints/sambaApi';

export async function waitCommand(serverId: number, commandId: number) {
	for (let attempt = 0; attempt < 30; attempt += 1) {
		const row = await sambaApi.command(serverId, commandId);
		if (row.status !== 'queued' && row.status !== 'delivered' && row.status !== 'running') {
			return row;
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	return sambaApi.command(serverId, commandId);
}

export async function runCommand(serverId: number, type: string, args: Record<string, unknown>): Promise<string | null> {
	const created = await sambaApi.enqueue(serverId, type, args);
	const row = await waitCommand(serverId, created.id);
	if (row.status === 'queued') {
		throw new Error('В очереди, агент ещё не забрал');
	}
	if (row.status === 'delivered' || row.status === 'running') {
		throw new Error('Агент выполняет');
	}
	if (row.status !== 'succeeded') {
		throw new Error(row.result || row.status);
	}
	return row.result;
}

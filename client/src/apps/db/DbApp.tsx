import { Button, Stack, Table, Text, Textarea } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { opsApi, type OpsLink } from '@/core/api/endpoints/opsApi';
import { OpsScreen } from '@/features/ops/OpsScreen';

import { DbEditorHost } from './DbEditor';

function QueryPane({ link }: { link: OpsLink }) {
	const [sql, setSql] = useState('select 1');
	const query = useMutation({
		mutationFn: () => opsApi.query(link.id, sql),
	});
	const result = query.data;

	return (
		<Stack gap="sm">
			<Text fw={600}>{link.name}</Text>
			<Text size="xs" c="dimmed">
				Один запрос, не больше 200 строк. {link.username}@{link.host}:{link.port}/{link.database_name}
			</Text>
			<Textarea minRows={5} value={sql} onChange={(event) => setSql(event.currentTarget.value)} />
			<Button w="fit-content" loading={query.isPending} onClick={() => query.mutate()}>
				Выполнить
			</Button>
			{query.isError ? <Text c="red" size="sm">{extractApiErrorMessage(query.error)}</Text> : null}
			{result ? (
				<Stack gap={4}>
					<Text size="xs" c="dimmed">
						Строк: {result.rows.length}
						{result.truncated ? ', список обрезан' : ''}
						{result.columns.length === 0 ? `, затронуто ${result.affected}` : ''}
					</Text>
					{result.columns.length > 0 ? (
						<Table striped withTableBorder>
							<Table.Thead>
								<Table.Tr>
									{result.columns.map((column) => (
										<Table.Th key={column}>{column}</Table.Th>
									))}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{result.rows.map((row, index) => (
									<Table.Tr key={index}>
										{row.map((cell, cellIndex) => (
											<Table.Td key={cellIndex}>{cell ?? ''}</Table.Td>
										))}
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					) : null}
				</Stack>
			) : null}
		</Stack>
	);
}

export default function DbApp() {
	return (
		<OpsScreen
			title="База"
			hint="Публичный адрес сервера, как у SSH."
			kind="db"
			subtitle={(link) => `${link.driver} ${link.username}@${link.host}:${link.port}/${link.database_name}`}
			editor={(link, close) => <DbEditorHost link={link} onClose={close} />}
			workspace={(link) => <QueryPane key={link.id} link={link} />}
		/>
	);
}

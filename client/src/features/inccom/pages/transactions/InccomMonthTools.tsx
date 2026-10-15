import { Button, FileButton, Group, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { userDataApi } from '@/core/api/endpoints/userData';
import {
	requestTransactionCreate,
	requestTransactionList,
} from '@inccom/entities/transaction/api/transaction';

const BUDGET_CODE = 'inccom.monthBudget';

export function InccomMonthTools({ accountId }: { accountId: number }) {
	const [budget, setBudget] = useState('');
	const [spent, setSpent] = useState(0);

	useEffect(() => {
		void userDataApi.getOptional(BUDGET_CODE).then((row) => {
			if (typeof row?.value === 'number' || typeof row?.value === 'string') {
				setBudget(String(row.value));
			}
		});
	}, []);

	useEffect(() => {
		if (!accountId) {
			return;
		}
		const dateFrom = dayjs().startOf('month').format('YYYY-MM-DD');
		const dateTo = dayjs().endOf('month').format('YYYY-MM-DD');
		void requestTransactionList({ accountId, dateFrom, dateTo, type: 'expense' })
			.then((page) => {
				const items = page.items ?? [];
				const sum = items.reduce((total, item) => total + Math.abs(Number(item.amount) || 0), 0);
				setSpent(sum);
			})
			.catch(() => setSpent(0));
	}, [accountId]);

	const limit = Number(budget) || 0;

	return (
		<Group gap="sm" align="flex-end">
			<TextInput
				label="Бюджет месяца"
				value={budget}
				onChange={(event) => setBudget(event.currentTarget.value)}
				onBlur={() => {
					void userDataApi.upsert({ code: BUDGET_CODE, value: Number(budget) || 0 });
				}}
				w={140}
			/>
			<Text size="sm">
				Расход: {spent.toFixed(0)}
				{limit > 0 ? ` / ${limit}` : ''}
			</Text>
			{limit > 0 ? (
				<div
					style={{
						width: 120,
						height: 8,
						background: 'var(--mantine-color-gray-3)',
						borderRadius: 4,
					}}
				>
					<div
						style={{
							width: `${Math.min(100, (spent / limit) * 100)}%`,
							height: '100%',
							background: spent > limit ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-blue-6)',
							borderRadius: 4,
						}}
					/>
				</div>
			) : null}
			<FileButton
				accept=".csv,text/csv"
				onChange={(file) => {
					if (!file || !accountId) {
						return;
					}
					void file.text().then(async (text) => {
						const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
						let created = 0;
						for (const line of lines) {
							const [date, amount, comment] = line.split(';');
							if (!date || !amount || Number.isNaN(Number(amount))) {
								continue;
							}
							await requestTransactionCreate({
								type: 'expense',
								accountId,
								date: date.trim(),
								amount: amount.trim(),
								comment: comment?.trim() || null,
							});
							created += 1;
						}
						notifications.show({ message: `Импорт: ${created}` });
					});
				}}
			>
				{(props) => (
					<Button size="xs" variant="default" {...props}>
						CSV
					</Button>
				)}
			</FileButton>
		</Group>
	);
}

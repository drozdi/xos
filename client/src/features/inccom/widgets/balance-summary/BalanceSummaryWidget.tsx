import { useAccountsQuery } from '@inccom/entities/account';
import { Card, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatBalance } from '@inccom/shared/utils/number-format';
import { useMemo } from 'react';

export function BalanceSummaryWidget() {
	const { data, isLoading } = useAccountsQuery();
	const accounts = data?.items ?? [];

	const totalBalance = useMemo(
		() => accounts.reduce((sum, account) => sum + (account.balance ?? 0), 0),
		[accounts],
	);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
			<Card withBorder padding="lg" radius="md">
				<Stack gap="xs">
					<Text size="sm" c="dimmed">
						Общий баланс
					</Text>
					<Text size="xl" fw={700}>
						{formatBalance(totalBalance)}
					</Text>
				</Stack>
			</Card>
			<Card withBorder padding="lg" radius="md">
				<Group justify="space-between">
					<Stack gap={4}>
						<Text size="sm" c="dimmed">
							Счетов
						</Text>
						<Text size="xl" fw={700}>
							{accounts.length}
						</Text>
					</Stack>
				</Group>
			</Card>
		</SimpleGrid>
	);
}

import {
	isBankAccountType,
	useAccountDelete,
	useAccountsQuery,
	useEnumsTypeAccount,
} from '@inccom/entities/account';
import {
	ActionIcon,
	Card,
	Flex,
	Group,
	Loader,
	Menu,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
	alpha,
} from '@mantine/core';
import { TbDots, TbPlus } from 'react-icons/tb';
import { formatBalance } from '@inccom/shared/utils/number-format';
import { transactionNewUrl, transferNewUrl } from '@inccom/shared/lib/transaction-url';
import { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

function formatAccountTitle(
	account: IAccount,
	typeLabel: string,
): string {
	const title = `${account.label} (${typeLabel})`;
	if (account.isMaster === false && account.owner) {
		return `${title} - ${account.owner}`;
	}
	return title;
}

export function AccountListWidget() {
	const { data, isLoading } = useAccountsQuery();
	const deleteMutation = useAccountDelete();
	const types = useEnumsTypeAccount();
	const [scope, setScope] = useState<'bank' | 'all'>('bank');
	const accounts = useMemo(() => {
		const items = data?.items ?? [];
		if (scope === 'all') {
			return items;
		}
		return items.filter((account) => isBankAccountType(account.type));
	}, [data?.items, scope]);

	async function handleDelete(account: IAccount) {
		await deleteMutation.mutateAsync(account.id);
	}

	if (isLoading) {
		return <Loader />;
	}

	return (
		<Stack gap="md">
			<SegmentedControl
				value={scope}
				onChange={(value) => setScope(value as 'bank' | 'all')}
				data={[
					{ value: 'bank', label: 'Банковские' },
					{ value: 'all', label: 'Все счета' },
				]}
				w="fit-content"
			/>
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				{accounts.length ? (
					accounts.map((account) => (
						<Card
							bg={account.color ? alpha(account.color, 0.5) : ''}
							key={account.id}
							padding="xl"
							shadow="xl"
							radius="xl"
						>
							<Card.Section withBorder inheritPadding py="xs">
								<Group justify="space-between">
									<Text fw={500}>
										{formatAccountTitle(
											account,
											types.findLabelByCode(account.type),
										)}
									</Text>
									<Menu withinPortal position="bottom-end" shadow="sm">
										<Menu.Target>
											<ActionIcon variant="subtle" color="gray">
												<TbDots />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>
											<Menu.Item
												component={Link}
												to={`/accounts/${account.id}/transactions`}
											>
												Транзакции
											</Menu.Item>
											<Menu.Item
												component={Link}
												to={`/accounts/${account.id}/categories`}
											>
												Категории
											</Menu.Item>
											<Menu.Item
												component={Link}
												to={transactionNewUrl('income', account.id)}
											>
												Доход
											</Menu.Item>
											<Menu.Item
												component={Link}
												to={transactionNewUrl('expense', account.id)}
											>
												Расход
											</Menu.Item>
											<Menu.Item
												component={Link}
												to={transferNewUrl(account.id)}
											>
												Перевод
											</Menu.Item>
											<Menu.Item
												c="red"
												onClick={() => handleDelete(account)}
											>
												Удалить
											</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								</Group>
							</Card.Section>
							<Card.Section
								component={NavLink}
								to={`/accounts/${account.id}`}
								py="xs"
							>
								<Flex h={100} justify="center" align="center" direction="column" gap={4}>
									<Text size="xl" fw={700}>
										{formatBalance(account.balance)}
									</Text>
									{account.number ? (
										<Text size="xs" c="dimmed">
											{account.number}
										</Text>
									) : null}
									{account.description ? (
										<Text size="xs" c="dimmed" lineClamp={1}>
											{account.description}
										</Text>
									) : null}
								</Flex>
							</Card.Section>
						</Card>
					))
				) : (
					<Card padding="xl">
						<Card.Section inheritPadding py="xs">
							<Text>
								{scope === 'bank'
									? 'Нет банковских счетов (debit/credit/deposit/saving). Добавьте новый или покажите все.'
									: 'Нет активных счетов. Добавьте новый счёт.'}
							</Text>
						</Card.Section>
					</Card>
				)}
				<Card shadow="xl" radius="xl">
					<Card.Section withBorder inheritPadding py="xs">
						<Group justify="space-between">
							<Text fw={500}>Новый счёт</Text>
							<ActionIcon variant="subtle" color="gray">
								<TbPlus />
							</ActionIcon>
						</Group>
					</Card.Section>
					<Card.Section component={NavLink} to="/accounts/new" withBorder py="xs">
						<Flex h={100} justify="center" align="center">
							<TbPlus size={90} />
						</Flex>
					</Card.Section>
				</Card>
			</SimpleGrid>
		</Stack>
	);
}

import { Button, Card, Col, Dropdown, Flex, Row, Spin, Typography } from 'antd';
import { TbDots, TbPlus } from 'react-icons/tb';
import { Link, NavLink } from 'react-router-dom';

import {
	useAccountDelete,
	useAccountsQuery,
	useEnumsTypeAccount,
} from '@inccom/entities/account';
import { transactionNewUrl, transferNewUrl } from '@inccom/shared/lib/transaction-url';
import { formatBalance } from '@inccom/shared/utils/number-format';

function formatAccountTitle(account: IAccount, typeLabel: string): string {
	const title = `${account.label} (${typeLabel})`;
	if (account.isMaster === false && account.owner) {
		return `${title} - ${account.owner}`;
	}
	return title;
}

function withAlpha(color: string, alpha: number): string {
	const hex = color.replace('#', '');
	if (hex.length !== 6) {
		return color;
	}
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AccountListWidget() {
	const { data, isLoading } = useAccountsQuery();
	const deleteMutation = useAccountDelete();
	const types = useEnumsTypeAccount();
	const accounts = data?.items ?? [];

	async function handleDelete(account: IAccount) {
		await deleteMutation.mutateAsync(account.id);
	}

	if (isLoading) {
		return <Spin />;
	}

	return (
		<Row gutter={[16, 16]}>
			{accounts.length ? (
				accounts.map((account) => (
					<Col key={account.id} xs={24} sm={12} lg={8}>
						<Card
							style={{
								background: account.color ? withAlpha(account.color, 0.5) : undefined,
								borderRadius: 16,
							}}
							title={formatAccountTitle(account, types.findLabelByCode(account.type))}
							extra={
								<Dropdown
									menu={{
										items: [
											{
												key: 'tx',
												label: (
													<Link to={`/accounts/${account.id}/transactions`}>
														Транзакции
													</Link>
												),
											},
											{
												key: 'cat',
												label: (
													<Link to={`/accounts/${account.id}/categories`}>
														Категории
													</Link>
												),
											},
											{
												key: 'income',
												label: (
													<Link to={transactionNewUrl('income', account.id)}>
														Доход
													</Link>
												),
											},
											{
												key: 'expense',
												label: (
													<Link to={transactionNewUrl('expense', account.id)}>
														Расход
													</Link>
												),
											},
											{
												key: 'transfer',
												label: (
													<Link to={transferNewUrl(account.id)}>Перевод</Link>
												),
											},
											{
												key: 'delete',
												danger: true,
												label: 'Удалить',
												onClick: () => void handleDelete(account),
											},
										],
									}}
								>
									<Button type="text" icon={<TbDots />} />
								</Dropdown>
							}
						>
							<NavLink to={`/accounts/${account.id}`} style={{ color: 'inherit' }}>
								<Flex style={{ height: 100 }} justify="center" align="center">
									<Typography.Title level={3} style={{ margin: 0 }}>
										{formatBalance(account.balance)}
									</Typography.Title>
								</Flex>
							</NavLink>
						</Card>
					</Col>
				))
			) : (
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Typography.Text>
							Нет активных счетов. Добавьте новый счёт.
						</Typography.Text>
					</Card>
				</Col>
			)}
			<Col xs={24} sm={12} lg={8}>
				<Card
					title="Новый счёт"
					extra={<Button type="text" icon={<TbPlus />} />}
					style={{ borderRadius: 16 }}
				>
					<NavLink to="/accounts/new" style={{ color: 'inherit' }}>
						<Flex style={{ height: 100 }} justify="center" align="center">
							<TbPlus size={90} />
						</Flex>
					</NavLink>
				</Card>
			</Col>
		</Row>
	);
}

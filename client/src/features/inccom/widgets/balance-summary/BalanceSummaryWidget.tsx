import { Card, Col, Row, Spin, Typography } from 'antd';
import { useMemo } from 'react';

import { useAccountsQuery } from '@inccom/entities/account';
import { formatBalance } from '@inccom/shared/utils/number-format';

export function BalanceSummaryWidget() {
	const { data, isLoading } = useAccountsQuery();
	const accounts = data?.items ?? [];

	const totalBalance = useMemo(
		() => accounts.reduce((sum, account) => sum + (account.balance ?? 0), 0),
		[accounts],
	);

	if (isLoading) {
		return <Spin />;
	}

	return (
		<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
			<Col xs={24} sm={12}>
				<Card>
					<Typography.Text type="secondary">Общий баланс</Typography.Text>
					<Typography.Title level={3} style={{ margin: '8px 0 0' }}>
						{formatBalance(totalBalance)}
					</Typography.Title>
				</Card>
			</Col>
			<Col xs={24} sm={12}>
				<Card>
					<Typography.Text type="secondary">Счетов</Typography.Text>
					<Typography.Title level={3} style={{ margin: '8px 0 0' }}>
						{accounts.length}
					</Typography.Title>
				</Card>
			</Col>
		</Row>
	);
}

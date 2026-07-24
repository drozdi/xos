import { Avatar, Flex, Typography } from 'antd';
import { TbAccessPoint } from 'react-icons/tb';
import { Link } from 'react-router-dom';

import { useStoreAccounts } from '@inccom/entities/account';
import { useStoreUserProfile } from '@inccom/entities/user';
import { formatBalance } from '@inccom/shared/utils/number-format';

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

function Item({ account }: { account: IAccount }) {
	const { userData } = useStoreUserProfile();
	return (
		<Link
			to={`/categories/${account.id}`}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: 12,
				borderRadius: 8,
				background: account.color ? withAlpha(account.color, 0.5) : undefined,
				color: 'inherit',
				textDecoration: 'none',
			}}
		>
			<Avatar style={{ background: '#13c2c2' }} icon={<TbAccessPoint size={24} />} />
			<div>
				<Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
					{account.owner_id === userData?.id ? 'Мой' : account.owner}
				</Typography.Text>
				<div>
					<Typography.Title level={4} style={{ margin: 0 }}>
						{account.label}
					</Typography.Title>
				</div>
				<Typography.Text>{formatBalance(account.balance)}</Typography.Text>
			</div>
		</Link>
	);
}

export function CategoriesAccount() {
	const storeAccounts = useStoreAccounts();
	return (
		<Flex vertical gap={8}>
			{storeAccounts.list.map((item) => (
				<Item key={item.id} account={item} />
			))}
		</Flex>
	);
}

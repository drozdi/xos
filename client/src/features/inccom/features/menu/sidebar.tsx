import { Menu, type MenuProps } from 'antd';
import {
	AppstoreOutlined,
	FallOutlined,
	RiseOutlined,
	SwapOutlined,
	TableOutlined,
	TagsOutlined,
	UnorderedListOutlined,
} from '@ant-design/icons';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';

import { transactionNewUrl, transferNewUrl } from '@inccom/shared/lib/transaction-url';

interface NavItem {
	key: string;
	label: string;
	icon: React.ReactNode;
	path: string;
	matchPrefix?: boolean;
	isActive?: (location: Location) => boolean;
}

const navItems: NavItem[] = [
	{
		key: 'accounts',
		label: 'Счета',
		icon: <TableOutlined style={{ fontSize: 16 }} />,
		path: '/accounts',
		matchPrefix: true,
	},
	{
		key: 'income',
		label: 'Доход',
		icon: <RiseOutlined style={{ fontSize: 16 }} />,
		path: transactionNewUrl('income'),
		isActive: (location) =>
			location.pathname === '/transactions/new' && location.search.includes('type=income'),
	},
	{
		key: 'expense',
		label: 'Расход',
		icon: <FallOutlined style={{ fontSize: 16 }} />,
		path: transactionNewUrl('expense'),
		isActive: (location) =>
			location.pathname === '/transactions/new' && location.search.includes('type=expense'),
	},
	{
		key: 'transfer',
		label: 'Перевод',
		icon: <SwapOutlined style={{ fontSize: 16 }} />,
		path: transferNewUrl(),
		isActive: (location) => location.pathname === '/transfers/new',
	},
	{
		key: 'items',
		label: 'Товары',
		icon: <UnorderedListOutlined style={{ fontSize: 16 }} />,
		path: '/items',
		matchPrefix: true,
	},
	{
		key: 'item-categories',
		label: 'Категории товаров',
		icon: <TagsOutlined style={{ fontSize: 16 }} />,
		path: '/item-categories',
	},
	{
		key: 'categories',
		label: 'Категории транзакций',
		icon: <AppstoreOutlined style={{ fontSize: 16 }} />,
		path: '/categories',
		matchPrefix: true,
	},
];

export const MainMenu = ({ mini = false }: { mini?: boolean }) => {
	const location = useLocation();
	const navigate = useNavigate();

	const isActive = useCallback(
		(item: NavItem) => {
			if (item.isActive) {
				return item.isActive(location);
			}
			return item.matchPrefix
				? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
				: location.pathname === item.path;
		},
		[location],
	);

	const selectedKeys = useMemo(
		() => navItems.filter((item) => isActive(item)).map((item) => item.key),
		[isActive],
	);

	const items = useMemo<MenuProps['items']>(
		() =>
			navItems.map((item) => ({
				key: item.key,
				icon: item.icon,
				label: item.label,
				title: item.label,
			})),
		[],
	);

	return (
		<Menu
			mode="inline"
			theme="dark"
			inlineCollapsed={mini}
			selectedKeys={selectedKeys}
			items={items}
			onClick={({ key }) => {
				const item = navItems.find((nav) => nav.key === key);
				if (item) {
					navigate(item.path);
				}
			}}
			style={{ borderInlineEnd: 'none', height: '100%' }}
		/>
	);
};

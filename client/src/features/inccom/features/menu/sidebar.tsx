import { Flex, Tooltip } from 'antd';
import { useCallback } from 'react';
import {
	TbArrowBigDownLines,
	TbArrowBigUpLines,
	TbArrowsExchange,
	TbCategory,
	TbListDetails,
	TbTable,
	TbTags,
} from 'react-icons/tb';
import { Link, useLocation, type Location } from 'react-router-dom';

import { transactionNewUrl, transferNewUrl } from '@inccom/shared/lib/transaction-url';

import classes from './sidebar.module.css';

interface NavItem {
	label: string;
	icon: React.ReactNode;
	path: string;
	matchPrefix?: boolean;
	isActive?: (location: Location) => boolean;
}

const navItems: NavItem[] = [
	{
		label: 'Счета',
		icon: <TbTable />,
		path: '/accounts',
		matchPrefix: true,
	},
	{
		label: 'Доход',
		icon: <TbArrowBigUpLines />,
		path: transactionNewUrl('income'),
		isActive: (location) =>
			location.pathname === '/transactions/new' &&
			location.search.includes('type=income'),
	},
	{
		label: 'Расход',
		icon: <TbArrowBigDownLines />,
		path: transactionNewUrl('expense'),
		isActive: (location) =>
			location.pathname === '/transactions/new' &&
			location.search.includes('type=expense'),
	},
	{
		label: 'Перевод',
		icon: <TbArrowsExchange />,
		path: transferNewUrl(),
		isActive: (location) => location.pathname === '/transfers/new',
	},
	{
		label: 'Товары',
		icon: <TbListDetails />,
		path: '/items',
		matchPrefix: true,
	},
	{
		label: 'Категории товаров',
		icon: <TbTags />,
		path: '/item-categories',
	},
	{
		label: 'Категории транзакций',
		icon: <TbCategory />,
		path: '/categories',
		matchPrefix: true,
	},
];

function NavbarLink({
	icon,
	label,
	active,
	path,
	mini = false,
}: {
	icon: React.ReactNode;
	label: string;
	active: boolean;
	path: string;
	mini?: boolean;
}) {
	const link = (
		<Link
			to={path}
			className={classes['link']}
			data-active={active || undefined}
			aria-label={label}
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 0,
				padding: '6px 8px',
				borderRadius: 6,
				color: 'inherit',
				textDecoration: 'none',
			}}
		>
			<Flex align="center" gap={mini ? 0 : 12}>
				<span style={{ display: 'inline-flex', fontSize: 18 }}>{icon}</span>
				{!mini ? <span>{label}</span> : null}
			</Flex>
		</Link>
	);

	if (!mini) {
		return link;
	}

	return (
		<Tooltip title={label} placement="right">
			{link}
		</Tooltip>
	);
}

export const MainMenu = ({ mini = false }: { mini?: boolean }) => {
	const location = useLocation();

	const isActive = useCallback(
		(item: NavItem) => {
			if (item.isActive) {
				return item.isActive(location);
			}
			return item.matchPrefix
				? location.pathname === item.path ||
						location.pathname.startsWith(`${item.path}/`)
				: location.pathname === item.path;
		},
		[location],
	);

	return navItems.map((nav) => (
		<NavbarLink
			key={nav.path}
			mini={mini}
			icon={nav.icon}
			label={nav.label}
			path={nav.path}
			active={isActive(nav)}
		/>
	));
};

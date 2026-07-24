import { Button, Flex, Typography } from 'antd';

import { BrowserIcon } from './BrowserIcon';

interface BrowserNewTabProps {
	onNavigate: (url: string) => void;
}

const QUICK_LINKS = [
	{ label: 'DuckDuckGo', url: 'https://duckduckgo.com' },
	{ label: 'Wikipedia', url: 'https://ru.wikipedia.org' },
	{ label: 'GitHub', url: 'https://github.com' },
];

export function BrowserNewTab({ onNavigate }: BrowserNewTabProps) {
	return (
		<Flex
			vertical
			align="center"
			justify="center"
			gap="middle"
			style={{ height: '100%', minHeight: 0, padding: 24 }}
		>
			<BrowserIcon size={48} />
			<Typography.Title level={4} style={{ margin: 0 }}>
				Новая вкладка
			</Typography.Title>
			<Typography.Text type="secondary" style={{ textAlign: 'center', maxWidth: 360, fontSize: 13 }}>
				Введите адрес в строку поиска или выберите сайт ниже
			</Typography.Text>
			<Flex vertical gap="small">
				{QUICK_LINKS.map((link) => (
					<Button key={link.url} type="primary" ghost onClick={() => onNavigate(link.url)}>
						{link.label}
					</Button>
				))}
			</Flex>
		</Flex>
	);
}

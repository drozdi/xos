import { Button, Stack, Text, Title } from '@mantine/core';

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
		<Stack align="center" justify="center" gap="md" p="xl" h="100%" style={{ minHeight: 0 }}>
			<BrowserIcon size={48} />
			<Title order={4}>Новая вкладка</Title>
			<Text size="sm" c="dimmed" ta="center" maw={360}>
				Введите адрес в строку поиска или выберите сайт ниже
			</Text>
			<Stack gap="xs">
				{QUICK_LINKS.map((link) => (
					<Button key={link.url} variant="light" onClick={() => onNavigate(link.url)}>
						{link.label}
					</Button>
				))}
			</Stack>
		</Stack>
	);
}

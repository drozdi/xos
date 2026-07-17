import { Accordion, Stack, Text } from '@mantine/core';

import { GAME_RULES } from './data/gameRules.js';

export function RulesContent() {
	return (
		<Stack gap="md" p="md">
			<Text size="sm" c="dimmed">
				Классические правила и особенности программы.
			</Text>
			<Accordion variant="separated" multiple>
				{GAME_RULES.map((rule) => (
					<Accordion.Item key={rule.id} value={rule.id}>
						<Accordion.Control>{rule.title}</Accordion.Control>
						<Accordion.Panel>
							<Text size="sm">{rule.content}</Text>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Stack>
	);
}

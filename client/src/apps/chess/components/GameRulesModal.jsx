import { Modal, Button, Accordion, Text, Title, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { GAME_RULES } from '../data/gameRules';

function GameRulesModal() {
	const [opened, { open, close }] = useDisclosure(false);

	return (
		<>
			<Button variant="light" fullWidth onClick={open}>
				Правила игры
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title={<Title order={3}>Правила шахмат</Title>}
				size="lg"
				centered
			>
				<Stack gap="md">
					<Text size="sm" c="dimmed">
						Классические правила и особенности этой программы. Разверните раздел, чтобы
						прочитать подробнее.
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
			</Modal>
		</>
	);
}

export default GameRulesModal;

import { Button, Collapse, Flex, Modal, Typography } from 'antd';
import { useState } from 'react';
import { GAME_RULES } from '../data/gameRules';

function GameRulesModal() {
	const [opened, setOpened] = useState(false);

	return (
		<>
			<Button type="primary" ghost block onClick={() => setOpened(true)}>
				Правила игры
			</Button>

			<Modal
				open={opened}
				onCancel={() => setOpened(false)}
				title="Правила шахмат"
				width={720}
				centered
				footer={null}
			>
				<Flex vertical gap="middle">
					<Typography.Text type="secondary" style={{ fontSize: 13 }}>
						Классические правила и особенности этой программы. Разверните раздел, чтобы
						прочитать подробнее.
					</Typography.Text>
					<Collapse
						items={GAME_RULES.map((rule) => ({
							key: rule.id,
							label: rule.title,
							children: <Typography.Text style={{ fontSize: 13 }}>{rule.content}</Typography.Text>,
						}))}
					/>
				</Flex>
			</Modal>
		</>
	);
}

export default GameRulesModal;

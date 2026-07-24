import { Collapse, Flex, Typography } from 'antd';

import { GAME_RULES } from './data/gameRules.js';

export function RulesContent() {
	return (
		<Flex vertical gap="middle" style={{ padding: 16 }}>
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Классические правила и особенности программы.
			</Typography.Text>
			<Collapse
				items={GAME_RULES.map((rule) => ({
					key: rule.id,
					label: rule.title,
					children: <Typography.Text style={{ fontSize: 13 }}>{rule.content}</Typography.Text>,
				}))}
			/>
		</Flex>
	);
}

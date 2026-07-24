import { Flex, Typography } from 'antd';

export function RulesContent() {
	return (
		<Flex vertical gap="small">
			<Typography.Title level={5} style={{ margin: 0 }}>
				Судоку
			</Typography.Title>
			<Typography.Text style={{ fontSize: 13 }}>
				Заполните поле цифрами так, чтобы в каждой строке, столбце и блоке не было повторов.
			</Typography.Text>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Размеры
			</Typography.Title>
			<ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
				<li>4×4 — блоки 2×2, цифры 1–4.</li>
				<li>6×6 — блоки 2×3, цифры 1–6.</li>
				<li>9×9 — блоки 3×3, цифры 1–9.</li>
			</ul>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Ручка и карандаш
			</Typography.Title>
			<ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
				<li>
					<strong>Ручка</strong> — ввод окончательного значения в клетку.
				</li>
				<li>
					<strong>Карандаш</strong> — заметки с возможными вариантами. Для 9×9 клетка делится на
					сетку 3×3, куда ставятся кандидаты.
				</li>
			</ul>
		</Flex>
	);
}

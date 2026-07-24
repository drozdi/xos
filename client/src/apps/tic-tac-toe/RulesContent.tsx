import { Flex, Typography } from 'antd';

export function RulesContent() {
	return (
		<Flex vertical gap="small">
			<Typography.Title level={5} style={{ margin: 0 }}>
				Крестики-нолики
			</Typography.Title>
			<Typography.Text style={{ fontSize: 13 }}>
				Игра для двух игроков: крестики (X) и нолики (O) по очереди ставят символы на поле.
				Побеждает тот, кто первым соберёт нужное число фигур в ряд.
			</Typography.Text>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Сложность
			</Typography.Title>
			<ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
				<li>Лёгкая — поле 3×3, победа при 3 в ряд.</li>
				<li>Средняя — поле 4×4, победа при 4 в ряд.</li>
				<li>Сложная — поле 5×5, победа при 4 в ряд.</li>
			</ul>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Как играть
			</Typography.Title>
			<ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
				<li>Игроки ходят по очереди, начинают крестики (X).</li>
				<li>Кликните по свободной клетке, чтобы сделать ход.</li>
				<li>Нельзя ходить в уже занятую клетку.</li>
				<li>Если все клетки заполнены и никто не выиграл — объявляется ничья.</li>
			</ul>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Управление
			</Typography.Title>
			<ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
				<li>
					<strong>Игра → Новая игра</strong> — выбрать сложность и начать новую партию.
				</li>
				<li>
					<strong>Справка → О нас</strong> — открыть это окно с правилами.
				</li>
			</ul>
		</Flex>
	);
}

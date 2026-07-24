import { Flex, Typography } from 'antd';

function FigureList({ figures }) {
	if (!figures.length) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Пока нет
			</Typography.Text>
		);
	}

	return (
		<Flex gap="small" wrap="wrap">
			{figures.map((figure) => (
				<div key={figure.key} style={{ width: 48, height: 48 }}>
					<img
						src={figure.img}
						alt={figure.label}
						style={{ width: '100%', height: '100%', objectFit: 'contain' }}
					/>
				</div>
			))}
		</Flex>
	);
}

function CapturedFiguresPanel({ lostWhiteFigures, lostBlackFigures }) {
	return (
		<div
			className="game-sidebar__paper"
			style={{ padding: 16, borderRadius: 8, border: '1px solid var(--xos-shell-border)' }}
		>
			<Flex vertical gap="large">
				<Typography.Title level={4} style={{ margin: 0 }}>
					Съеденные фигуры
				</Typography.Title>

				<Flex vertical gap="small">
					<Typography.Text strong style={{ fontSize: 13 }}>
						Белые
					</Typography.Text>
					<FigureList figures={lostWhiteFigures} />
				</Flex>

				<Flex vertical gap="small">
					<Typography.Text strong style={{ fontSize: 13 }}>
						Чёрные
					</Typography.Text>
					<FigureList figures={lostBlackFigures} />
				</Flex>
			</Flex>
		</div>
	);
}

export default CapturedFiguresPanel;

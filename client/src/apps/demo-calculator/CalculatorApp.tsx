import { Button, Col, Flex, Row, Typography } from 'antd';
import type { CSSProperties } from 'react';

import {
	CALCULATOR_BUTTON_MATRIX,
	formatButtonLabel,
	getButtonSpan,
	getCalculatorButtonGroup,
} from './calculatorLogic';
import { useCalculator } from './useCalculator';

const DISPLAY_PANEL_HEIGHT = 72;
const BUTTON_HEIGHT = 48;

function buttonStyle(key: string): CSSProperties {
	const group = getCalculatorButtonGroup(key);
	if (group === 'function') {
		return { background: '#8c8c8c', color: '#fff', borderColor: '#8c8c8c' };
	}
	if (group === 'operator') {
		return { background: '#fa8c16', color: '#fff', borderColor: '#fa8c16' };
	}
	return { background: '#262626', color: '#fff', borderColor: '#262626' };
}

export default function CalculatorApp() {
	const { state, pressKey, title, subtitle } = useCalculator();

	return (
		<div
			style={{
				height: '100%',
				padding: 16,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				minHeight: 0,
				boxSizing: 'border-box',
			}}
		>
			<div
				style={{
					flexShrink: 0,
					height: DISPLAY_PANEL_HEIGHT,
					overflow: 'hidden',
				}}
			>
				<Flex vertical gap={4} justify="flex-end" style={{ height: '100%' }}>
					<Typography.Text
						type="secondary"
						style={{
							textAlign: 'right',
							fontSize: 13,
							lineHeight: 1.25,
							fontVariantNumeric: 'tabular-nums',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							height: '1.25rem',
						}}
					>
						{subtitle || '\u00A0'}
					</Typography.Text>
					<Typography.Text
						strong
						style={{
							textAlign: 'right',
							fontSize: 24,
							lineHeight: 1.2,
							fontVariantNumeric: 'tabular-nums',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							height: '2rem',
						}}
					>
						{title}
					</Typography.Text>
				</Flex>
			</div>

			<div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
				<Row gutter={[8, 8]}>
					{CALCULATOR_BUTTON_MATRIX.flatMap((row, rowIndex) =>
						row.map((value, columnIndex) => {
							const key = String(value);
							const span = getButtonSpan(value) * 2;

							return (
								<Col key={`${rowIndex}-${columnIndex}-${key}`} span={span}>
									<Button
										block
										disabled={state.disabled.includes(key)}
										onClick={() => pressKey(key)}
										style={{ height: BUTTON_HEIGHT, ...buttonStyle(key) }}
									>
										{formatButtonLabel(value)}
									</Button>
								</Col>
							);
						}),
					)}
				</Row>
			</div>
		</div>
	);
}

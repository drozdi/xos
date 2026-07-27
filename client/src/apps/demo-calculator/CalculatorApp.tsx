import { Box, Button, Grid, Stack, Text } from '@mantine/core';

import {
	CALCULATOR_BUTTON_MATRIX,
	formatButtonLabel,
	getButtonSpan,
	getCalculatorButtonProps,
} from './calculatorLogic';
import { useCalculator } from './useCalculator';

const DISPLAY_PANEL_HEIGHT = 72;
const BUTTON_HEIGHT = 48;

export default function CalculatorApp() {
	const { state, pressKey, title, subtitle } = useCalculator();

	return (
		<Box
			h="100%"
			p="md"
			style={{
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				minHeight: 0,
				boxSizing: 'border-box',
			}}
		>
			<Box
				style={{
					flexShrink: 0,
					height: DISPLAY_PANEL_HEIGHT,
					overflow: 'hidden',
				}}
			>
				<Stack gap={4} justify="flex-end" h="100%">
					<Text
						ta="right"
						size="sm"
						c="dimmed"
						lh={1.25}
						style={{
							fontVariantNumeric: 'tabular-nums',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							height: '1.25rem',
						}}
					>
						{subtitle || '\u00A0'}
					</Text>
					<Text
						ta="right"
						size="xl"
						fw={600}
						lh={1.2}
						style={{
							fontVariantNumeric: 'tabular-nums',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							height: '2rem',
						}}
					>
						{title}
					</Text>
				</Stack>
			</Box>

			<Box style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
				<Grid gap="xs">
					{CALCULATOR_BUTTON_MATRIX.flatMap((row, rowIndex) =>
						row.map((value, columnIndex) => {
							const key = String(value);
							const { variant, color } = getCalculatorButtonProps(key);

							return (
								<Grid.Col
									key={`${rowIndex}-${columnIndex}-${key}`}
									span={getButtonSpan(value)}
								>
									<Button
										fullWidth
										h={BUTTON_HEIGHT}
										variant={variant}
										color={color}
										disabled={state.disabled.includes(key)}
										onClick={() => pressKey(key)}
									>
										{formatButtonLabel(value)}
									</Button>
								</Grid.Col>
							);
						}),
					)}
				</Grid>
			</Box>
		</Box>
	);
}

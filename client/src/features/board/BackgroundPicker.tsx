import { Box, Group, Popover, Text, UnstyledButton } from '@mantine/core';
import { IconPalette } from '@tabler/icons-react';

export const BOARD_BACKGROUND_COLORS = [
	'#0079bf',
	'#d29034',
	'#519839',
	'#b04632',
	'#89609e',
	'#cd5a91',
	'#4bbf6b',
	'#00aecc',
	'#838c91',
] as const;

interface BackgroundPickerProps {
	value: string;
	onChange: (color: string) => void;
	disabled?: boolean;
}

export function BackgroundPicker({ value, onChange, disabled }: BackgroundPickerProps) {
	return (
		<Popover position="bottom-end" withArrow shadow="md">
			<Popover.Target>
				<UnstyledButton
					disabled={disabled}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						padding: '4px 8px',
						borderRadius: 'var(--mantine-radius-sm)',
						opacity: disabled ? 0.5 : 1,
					}}
				>
					<Box
						w={18}
						h={18}
						style={{
							borderRadius: 4,
							backgroundColor: value,
							border: '1px solid var(--mantine-color-default-border)',
						}}
					/>
					<IconPalette size={16} />
					<Text size="xs">Фон</Text>
				</UnstyledButton>
			</Popover.Target>
			<Popover.Dropdown>
				<Group gap="xs">
					{BOARD_BACKGROUND_COLORS.map((color) => (
						<UnstyledButton
							key={color}
							onClick={() => onChange(color)}
							style={{
								width: 28,
								height: 28,
								borderRadius: 6,
								backgroundColor: color,
								border:
									value === color
										? '2px solid var(--mantine-color-text)'
										: '1px solid var(--mantine-color-default-border)',
							}}
							aria-label={`Цвет ${color}`}
						/>
					))}
				</Group>
			</Popover.Dropdown>
		</Popover>
	);
}

interface MinesweeperIconProps {
	size?: number;
}

export function MinesweeperIcon({ size = 24 }: MinesweeperIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			aria-hidden
		>
			<circle cx="12" cy="13" r="6" />
			<line x1="12" y1="3" x2="12" y2="7" />
			<line x1="12" y1="19" x2="12" y2="21" />
			<line x1="5" y1="13" x2="3" y2="13" />
			<line x1="21" y1="13" x2="19" y2="13" />
			<line x1="6.5" y1="7.5" x2="5" y2="6" />
			<line x1="17.5" y1="7.5" x2="19" y2="6" />
			<circle cx="10" cy="12" r="1" fill="currentColor" stroke="none" />
			<circle cx="14" cy="12" r="1" fill="currentColor" stroke="none" />
			<circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
		</svg>
	);
}

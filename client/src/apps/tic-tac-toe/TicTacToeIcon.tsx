interface TicTacToeIconProps {
	size?: number;
}

export function TicTacToeIcon({ size = 24 }: TicTacToeIconProps) {
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
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<line x1="3" y1="9" x2="21" y2="9" />
			<line x1="3" y1="15" x2="21" y2="15" />
			<line x1="9" y1="3" x2="9" y2="21" />
			<line x1="15" y1="3" x2="15" y2="21" />
			<line x1="10" y1="5" x2="14" y2="9" />
			<line x1="14" y1="5" x2="10" y2="9" />
			<circle cx="18" cy="18" r="1.5" fill="currentColor" stroke="none" />
		</svg>
	);
}

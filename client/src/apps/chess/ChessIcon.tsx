interface ChessIconProps {
	size?: number;
}

export function ChessIcon({ size = 24 }: ChessIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M12 3v2" />
			<path d="M8 5h8" />
			<path d="M9 7h6l-1 3H10L9 7z" />
			<path d="M7 10h10v2c0 3-1.5 5-5 5s-5-2-5-5v-2z" />
			<path d="M6 19h12" />
			<path d="M5 21h14" />
		</svg>
	);
}

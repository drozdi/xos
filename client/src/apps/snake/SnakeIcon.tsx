interface SnakeIconProps {
	size?: number;
}

export function SnakeIcon({ size = 24 }: SnakeIconProps) {
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
			<path d="M4 16c0-4 3-6 6-6h2c2 0 3-1 3-3s-1-3-3-3H8" />
			<path d="M12 10c4 0 8 2 8 6s-3 4-6 4H9" />
			<circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
		</svg>
	);
}

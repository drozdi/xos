interface SolitaireIconProps {
	size?: number;
}

export function SolitaireIcon({ size = 24 }: SolitaireIconProps) {
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
			<rect x="4" y="3" width="11" height="15" rx="2" />
			<rect x="9" y="6" width="11" height="15" rx="2" />
			<path d="M14.5 12.5c0-1.5 1.5-2 1.5-3.2 0-.9-.7-1.3-1.5-1.3s-1.5.4-1.5 1.3c0 1.2 1.5 1.7 1.5 3.2z" />
			<circle cx="14.5" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
		</svg>
	);
}

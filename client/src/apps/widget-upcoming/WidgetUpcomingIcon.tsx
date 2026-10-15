interface WidgetUpcomingIconProps {
	size?: number;
}

export function WidgetUpcomingIcon({ size = 24 }: WidgetUpcomingIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden
		>
			<path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
			<path d="M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
		</svg>
	);
}

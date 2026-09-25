interface WidgetClockIconProps {
	size?: number;
}

export function WidgetClockIcon({ size = 24 }: WidgetClockIconProps) {
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
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" strokeLinecap="round" />
		</svg>
	);
}

interface WidgetRemindersIconProps {
	size?: number;
}

export function WidgetRemindersIcon({ size = 24 }: WidgetRemindersIconProps) {
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
			<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" />
			<path d="M10 21a2 2 0 0 0 4 0" strokeLinecap="round" />
		</svg>
	);
}

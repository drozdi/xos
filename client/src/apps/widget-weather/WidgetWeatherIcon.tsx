interface WidgetWeatherIconProps {
	size?: number;
}

export function WidgetWeatherIcon({ size = 24 }: WidgetWeatherIconProps) {
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
			<circle cx="8" cy="9" r="3" />
			<path d="M14 16a4 4 0 1 0-1-7.8A5 5 0 0 0 6 16h8z" />
		</svg>
	);
}

interface CalculatorIconProps {
	size?: number;
}

export function CalculatorIcon({ size = 24 }: CalculatorIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<rect x="4" y="2" width="16" height="20" rx="2" />
			<line x1="8" y1="6" x2="16" y2="6" />
			<line x1="8" y1="10" x2="8" y2="10.01" />
			<line x1="12" y1="10" x2="12" y2="10.01" />
			<line x1="16" y1="10" x2="16" y2="10.01" />
			<line x1="8" y1="14" x2="8" y2="14.01" />
			<line x1="12" y1="14" x2="12" y2="14.01" />
			<line x1="16" y1="14" x2="16" y2="14.01" />
			<line x1="8" y1="18" x2="8" y2="18.01" />
			<line x1="12" y1="18" x2="12" y2="18.01" />
			<line x1="16" y1="18" x2="16" y2="18.01" />
		</svg>
	);
}

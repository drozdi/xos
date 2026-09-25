interface OfficeViewerIconProps {
	size?: number;
}

export function OfficeViewerIcon({ size = 24 }: OfficeViewerIconProps) {
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
			<path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
			<path d="M15 3v4h4" />
			<path d="M8 12h8M8 16h6" strokeLinecap="round" />
		</svg>
	);
}

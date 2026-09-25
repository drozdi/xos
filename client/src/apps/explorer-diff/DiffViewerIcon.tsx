interface DiffViewerIconProps {
	size?: number;
}

export function DiffViewerIcon({ size = 24 }: DiffViewerIconProps) {
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
			<path d="M4 6h7M4 12h7M4 18h7" />
			<path d="M13 6h7M13 12h7M13 18h7" />
			<path d="M11 9v6" />
		</svg>
	);
}

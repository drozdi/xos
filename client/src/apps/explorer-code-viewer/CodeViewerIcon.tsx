interface CodeViewerIconProps {
	size?: number;
}

export function CodeViewerIcon({ size = 24 }: CodeViewerIconProps) {
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
			<path d="M8 8l-4 4 4 4" />
			<path d="M16 8l4 4-4 4" />
			<path d="M14 4l-4 16" />
		</svg>
	);
}

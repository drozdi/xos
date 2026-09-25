interface MapViewerIconProps {
	size?: number;
}

export function MapViewerIcon({ size = 24 }: MapViewerIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
			<path d="M9 4v14M15 6v14" />
		</svg>
	);
}

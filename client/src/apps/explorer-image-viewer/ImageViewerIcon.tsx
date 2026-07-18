export function ImageViewerIcon({ size = 24 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
			<circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
			<path d="M5 17l4-4 3 3 4-5 3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}

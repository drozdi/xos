export function VideoPlayerIcon({ size = 24 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
			<path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" />
		</svg>
	);
}

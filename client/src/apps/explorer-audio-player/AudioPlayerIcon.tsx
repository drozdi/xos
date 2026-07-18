export function AudioPlayerIcon({ size = 24 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M9 8.5v7l6.5-3.5L9 8.5Z" fill="currentColor" />
			<path d="M6 18a3 3 0 1 0 0-6M18 16a3 3 0 1 0 0-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}

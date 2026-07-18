export function ArchiverIcon({ size = 24 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
			<path d="M8 7h8M8 11h8M8 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}

export function NotepadIcon({ size = 24 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="5" y="3" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
			<path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}

interface StickyNoteIconProps {
	size?: number;
}

export function StickyNoteIcon({ size = 24 }: StickyNoteIconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M5 3h11l3 3v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
				fill="#fff59d"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path d="M16 3v4h4" stroke="currentColor" strokeWidth="1.5" />
			<path d="M8 11h8M8 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

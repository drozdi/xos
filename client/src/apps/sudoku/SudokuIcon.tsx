interface SudokuIconProps {
	size?: number;
}

export function SudokuIcon({ size = 24 }: SudokuIconProps) {
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
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<line x1="3" y1="9" x2="21" y2="9" strokeWidth="2.5" />
			<line x1="3" y1="15" x2="21" y2="15" strokeWidth="2.5" />
			<line x1="9" y1="3" x2="9" y2="21" strokeWidth="2.5" />
			<line x1="15" y1="3" x2="15" y2="21" strokeWidth="2.5" />
			<text x="5.5" y="7.5" fontSize="4" fill="currentColor" stroke="none">
				5
			</text>
			<text x="11.5" y="13.5" fontSize="4" fill="currentColor" stroke="none">
				3
			</text>
			<text x="17.5" y="19.5" fontSize="4" fill="currentColor" stroke="none">
				9
			</text>
		</svg>
	);
}

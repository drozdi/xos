interface ExplorerIconProps {
	size?: number;
}

export function ExplorerIcon({ size = 24 }: ExplorerIconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l1.5 2h9A1.5 1.5 0 0 1 21 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-11Z"
				stroke="currentColor"
				strokeWidth="1.8"
			/>
		</svg>
	);
}

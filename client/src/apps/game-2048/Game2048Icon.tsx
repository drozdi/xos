interface Game2048IconProps {
	size?: number;
}

export function Game2048Icon({ size = 24 }: Game2048IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="2" y="2" width="20" height="20" rx="3" fill="#edc22e" />
			<text
				x="12"
				y="16"
				textAnchor="middle"
				fontSize="8"
				fontWeight="700"
				fill="#776e65"
			>
				2048
			</text>
		</svg>
	);
}

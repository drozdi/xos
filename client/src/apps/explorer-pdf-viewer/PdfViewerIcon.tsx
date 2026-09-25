interface PdfViewerIconProps {
	size?: number;
}

export function PdfViewerIcon({ size = 24 }: PdfViewerIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden
		>
			<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
			<path d="M14 3v5h5" />
			<path d="M9 13h6M9 17h4" strokeLinecap="round" />
		</svg>
	);
}

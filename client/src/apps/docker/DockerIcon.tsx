import { ToolIcon } from '@/features/ops/ToolIcon';

export function DockerIcon({ size = 32 }: { size?: number }) {
	return (
		<ToolIcon size={size}>
			<path d="M4 14h16" />
			<path d="M6 14V9h3v5" />
			<path d="M9 14V7h3v7" />
			<path d="M12 14V8h3v6" />
			<path d="M15 11h3.5a2.5 2.5 0 0 1 0 5H4a3 3 0 0 1 0-6h1" />
		</ToolIcon>
	);
}

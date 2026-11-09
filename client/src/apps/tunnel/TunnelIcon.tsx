import { ToolIcon } from '@/features/ops/ToolIcon';

export function TunnelIcon({ size = 32 }: { size?: number }) {
	return (
		<ToolIcon size={size}>
			<path d="M4 8h6a4 4 0 0 1 0 8H4" />
			<path d="M20 8h-6a4 4 0 0 0 0 8h6" />
			<path d="M8 12h8" />
		</ToolIcon>
	);
}

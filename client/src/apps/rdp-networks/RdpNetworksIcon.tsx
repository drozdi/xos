import { ToolIcon } from '@/features/ops/ToolIcon';

export function RdpNetworksIcon({ size = 32 }: { size?: number }) {
	return (
		<ToolIcon size={size}>
			<circle cx="6" cy="12" r="2" />
			<circle cx="18" cy="7" r="2" />
			<circle cx="18" cy="17" r="2" />
			<path d="M8 12h8" />
			<path d="M16 8l-6 3" />
			<path d="M16 16l-6-3" />
		</ToolIcon>
	);
}

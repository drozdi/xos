import { ToolIcon } from '@/features/ops/ToolIcon';

export function VncIcon({ size = 32 }: { size?: number }) {
	return (
		<ToolIcon size={size}>
			<rect x="3" y="4" width="18" height="12" rx="2" />
			<path d="M8 20h8" />
			<path d="M12 16v4" />
		</ToolIcon>
	);
}

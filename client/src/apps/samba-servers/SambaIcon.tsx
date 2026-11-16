import { ToolIcon } from '@/features/ops/ToolIcon';

export function SambaIcon({ size = 32 }: { size?: number }) {
	return (
		<ToolIcon size={size}>
			<rect x="3" y="4" width="18" height="6" rx="1" />
			<rect x="3" y="14" width="18" height="6" rx="1" />
			<path d="M7 7h.01" />
			<path d="M7 17h.01" />
		</ToolIcon>
	);
}

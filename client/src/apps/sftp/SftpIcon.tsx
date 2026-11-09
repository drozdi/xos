import { ToolIcon } from '@/features/ops/ToolIcon';

export function SftpIcon({ size = 32 }: { size?: number }) {
	return (
		<ToolIcon size={size}>
			<path d="M4 7h6l2 2h8v10H4z" />
			<path d="M8 14h8" />
			<path d="M12 11v6" />
		</ToolIcon>
	);
}

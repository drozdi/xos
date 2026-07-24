import { Flex, Spin } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

export type LoadingProps = {
	children: ReactNode;
	active?: boolean;
	keepMounted?: boolean;
	skeleton?: ReactNode;
	style?: CSSProperties;
	className?: string;
};

export function Loading({
	children,
	active,
	keepMounted,
	skeleton,
	style,
	className,
}: LoadingProps) {
	if (active && skeleton) {
		return (
			<div className={className} style={{ position: 'relative', ...style }}>
				{skeleton}
			</div>
		);
	}

	return (
		<div
			className={className}
			style={{
				position: 'relative',
				minWidth: active ? 300 : undefined,
				minHeight: active ? 300 : undefined,
				...style,
			}}
		>
			{(keepMounted || !active) && children}
			{active ? (
				<Flex
					align="center"
					justify="center"
					className="xos-loading-overlay"
					style={{
						position: 'absolute',
						inset: 0,
						zIndex: 10,
						background: 'color-mix(in srgb, var(--xos-shell-bg-elevated, #fff) 55%, transparent)',
						backdropFilter: 'blur(2px)',
					}}
				>
					<Spin size="large" />
				</Flex>
			) : null}
		</div>
	);
}

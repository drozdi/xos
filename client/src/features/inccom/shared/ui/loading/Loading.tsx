import { Spin } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

interface LoadingProps {
	children: ReactNode;
	active?: boolean;
	keepMounted?: boolean;
	style?: CSSProperties;
	className?: string;
	h?: string | number;
	mih?: string | number;
	miw?: string | number;
}

export function Loading({
	children,
	active,
	keepMounted,
	style,
	className,
	h,
	mih,
	miw,
}: LoadingProps) {
	const show = !active || keepMounted;
	return (
		<div
			className={className}
			style={{
				position: 'relative',
				minWidth: active ? (miw ?? 300) : miw,
				minHeight: active ? (mih ?? 300) : mih,
				height: h,
				...style,
			}}
		>
			{active ? (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						zIndex: 1000,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: 'rgba(255,255,255,0.45)',
					}}
				>
					<Spin size="large" />
				</div>
			) : null}
			{show ? children : null}
		</div>
	);
}

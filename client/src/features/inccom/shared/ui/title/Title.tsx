import { Typography } from 'antd';
import type { ReactNode } from 'react';

interface TitleProps {
	children?: ReactNode;
	order?: 1 | 2 | 3 | 4 | 5;
	level?: 1 | 2 | 3 | 4 | 5;
	size?: string;
	fw?: string | number;
	style?: React.CSSProperties;
	className?: string;
}

const ORDER_TO_LEVEL: Record<number, 1 | 2 | 3 | 4 | 5> = {
	1: 1,
	2: 2,
	3: 3,
	4: 4,
	5: 5,
};

export function Title({ children, order = 1, level, style, className, fw }: TitleProps) {
	if (!children) {
		return null;
	}
	return (
		<Typography.Title
			level={level ?? ORDER_TO_LEVEL[order] ?? 3}
			className={className}
			style={{ fontWeight: fw, margin: 0, ...style }}
		>
			{children}
		</Typography.Title>
	);
}

import { Typography } from 'antd';

import { ResizablePanel } from './ResizablePanel';
import { AREA_ID_TO_NAME } from './parseView';

type LayoutAreaId = keyof typeof AREA_ID_TO_NAME;

interface LayoutAreaProps {
	area: LayoutAreaId;
	children?: React.ReactNode;
}

export function LayoutArea({ area, children }: LayoutAreaProps) {
	const areaName = AREA_ID_TO_NAME[area];

	if (area === 'l' || area === 'r') {
		return (
			<ResizablePanel side={area === 'l' ? 'left' : 'right'} areaName={areaName}>
				{children ?? (
					<Typography.Text type="secondary" style={{ fontSize: 13 }}>
						{area === 'l' ? 'Left panel' : 'Right panel'}
					</Typography.Text>
				)}
			</ResizablePanel>
		);
	}

	return (
		<div
			style={{
				gridArea: areaName,
				position: 'relative',
				minHeight: 0,
				minWidth: 0,
				overflow: area === 'm' ? 'hidden' : undefined,
				backgroundColor: area === 'h' ? 'var(--xos-shell-bg)' : area === 'f' ? 'transparent' : undefined,
				borderBottom: area === 'h' ? '1px solid var(--xos-shell-border)' : undefined,
			}}
		>
			{children}
		</div>
	);
}

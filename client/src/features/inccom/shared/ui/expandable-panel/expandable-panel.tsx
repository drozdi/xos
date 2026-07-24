import { Button, Card, Flex, Spin, Typography } from 'antd';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { TbArrowsMaximize, TbArrowsMinimize } from 'react-icons/tb';

interface ExpandablePanelProps {
	title: string;
	loading?: boolean;
	keepMounted?: boolean;
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
}

export function ExpandablePanel({
	title,
	loading = false,
	children,
	keepMounted = true,
	style,
	className,
}: ExpandablePanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Card
			size="small"
			className={className}
			style={{
				position: isExpanded ? 'fixed' : 'relative',
				top: isExpanded ? 0 : undefined,
				left: isExpanded ? 0 : undefined,
				width: isExpanded ? '100vw' : '100%',
				height: isExpanded ? '100vh' : undefined,
				zIndex: isExpanded ? 1100 : 1,
				overflow: 'auto',
				...style,
			}}
		>
			{loading ? (
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
					<Spin />
				</div>
			) : null}
			<Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
				<Typography.Text strong>{title}</Typography.Text>
				<Button
					type="text"
					size="small"
					onClick={() => setIsExpanded((v) => !v)}
					icon={isExpanded ? <TbArrowsMinimize /> : <TbArrowsMaximize />}
				>
					{isExpanded ? 'Свернуть' : 'Развернуть'}
				</Button>
			</Flex>
			{(keepMounted || isExpanded) && (
				<div style={{ minHeight: loading ? 300 : undefined, minWidth: loading ? 300 : undefined }}>
					{children}
				</div>
			)}
		</Card>
	);
}

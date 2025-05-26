import React, { memo } from 'react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export interface XSidebarHeaderProps {
	children: React.ReactNode;
}

export const XSidebarHeader = memo(({ children }: XSidebarHeaderProps) => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isMini = ctx?.mini || false;

	return <div className="x-sidebar-header">{children}</div>;
});

import React, { memo } from 'react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export interface XSidebarFooterProps {
	children: React.ReactNode;
}

export const XSidebarFooter = memo(({ children }: XSidebarFooterProps) => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isMini = ctx?.mini || false;

	return <div className="x-sidebar-footer">{children}</div>;
});

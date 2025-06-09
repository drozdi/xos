import React, { memo } from 'react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export interface XSidebarTitleProps {
	children: React.ReactNode;
}

export const XSidebarTitle = memo(({ children }: XSidebarTitleProps) => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isMini = ctx?.mini || false;

	return <div className="x-sidebar-title">{children}</div>;
});

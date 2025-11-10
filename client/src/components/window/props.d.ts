interface PositionState {
	left?: number | string;
	top?: number | string;
	width?: number | string;
	height?: number | string;
	zIndex?: number;
}

interface StateState {
	isFullscreen: boolean;
	isCollapse: boolean;
	isActive: boolean;
}

interface WindowContextValue {
	__?: string;
	uid: string;
	wmGroup?: string;
	wmSort?: number;
	title?: string;
	isFullscreen: boolean;
	isCollapse: boolean;
	position: PositionState;
	w?: number | string;
	h?: number | string;
	x?: number | string;
	y?: number | string;
	z?: number | string;
	focus: Function;
	blur: Function;
}

interface WindowProviderProps {
	children: ReactNode;
	value: WindowContextValue;
}

interface IWindowProps {
	parent?: HTMLElement;
	aspectFactor?: number;
	className?: string;
	children: React.ReactNode;
	x?: number | string;
	y?: number | string;
	z?: number;
	w?: number | string;
	h?: number | string;
	title?: string;
	icons?: string;
	resizable?: boolean;
	draggable?: boolean;
	wmGroup?: string;
	wmSort?: number;
	tabIndex?: number;
	onFullscreen?: (fullscreen: boolean) => void;
	onCollapse?: (collapse: boolean) => void;
	onReload?: (event: React.MouseEvent) => void;
	onClose?: (event: React.MouseEvent) => void;
}

interface IWindowIconsProps {
	icons?: string;
	resizable?: boolean;
	isFullscreen?: boolean;
	onFullscreen?: MouseEventHandler;
	onCollapse?: MouseEventHandler;
	onClose?: MouseEventHandler;
	onReload?: MouseEventHandler;
}

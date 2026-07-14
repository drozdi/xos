/** Core domain types — Stage 5+ */
export interface WindowState {
	id: string;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
	minimized: boolean;
	maximized: boolean;
}

export interface AppManifest {
	id: string;
	name: string;
	icon?: string;
}

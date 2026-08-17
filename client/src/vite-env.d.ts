/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_USE_API_SETTINGS: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module 'react-cytoscapejs' {
	import type { Core, ElementDefinition, Stylesheet } from 'cytoscape';
	import type { CSSProperties } from 'react';

	interface CytoscapeComponentProps {
		elements: ElementDefinition[];
		stylesheet?: Stylesheet[];
		layout?: Record<string, unknown>;
		style?: CSSProperties;
		cy?: (cy: Core) => void;
	}

	const CytoscapeComponent: (props: CytoscapeComponentProps) => JSX.Element;
	export default CytoscapeComponent;
}

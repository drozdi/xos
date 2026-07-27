import { Breadcrumbs, Text } from '@mantine/core';

export interface ExplorerCrumb {
	label: string;
	path: string;
}

interface ExplorerBreadcrumbProps {
	crumbs: ExplorerCrumb[];
	onNavigate: (path: string) => void;
}

export function ExplorerBreadcrumb({ crumbs, onNavigate }: ExplorerBreadcrumbProps) {
	return (
		<Breadcrumbs>
			{crumbs.map((crumb) => (
				<Text
					key={crumb.path}
					component="button"
					type="button"
					onClick={() => onNavigate(crumb.path.endsWith('://') ? crumb.path : `${crumb.path}/`)}
					style={{ background: 'none', border: 0, cursor: 'pointer' }}
				>
					{crumb.label}
				</Text>
			))}
		</Breadcrumbs>
	);
}

function buildBreadcrumbs(path: string): ExplorerCrumb[] {
	const match = /^([a-z0-9_-]+):\/\/(.*)$/i.exec(path);
	if (!match) {
		return [{ label: path, path }];
	}
	const disk = (match[1] ?? 'home').toLowerCase();
	const rest = match[2]?.replace(/\/+$/, '') ?? '';
	const crumbs: ExplorerCrumb[] = [{ label: disk.toUpperCase(), path: `${disk}://` }];
	if (!rest) {
		return crumbs;
	}
	let current = `${disk}://`;
	for (const part of rest.split('/')) {
		current = current.endsWith('://') ? `${current}${part}` : `${current}/${part}`;
		crumbs.push({ label: part, path: current });
	}
	return crumbs;
}

export { buildBreadcrumbs };

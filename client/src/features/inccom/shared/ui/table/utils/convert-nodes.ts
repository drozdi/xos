import { type TableNode } from '../type';

export function convertNodes<T = object>(
	items: T[],
	prevNodes: TableNode<T>[] = [],
): TableNode<T>[] {
	if (
		prevNodes.length === items.length &&
		items.every((item, index) => prevNodes[index]?.data === item)
	) {
		let changed = false;
		const next = prevNodes.map((node, index) => {
			if (node.index === index) {
				return node;
			}
			changed = true;
			return { ...node, index };
		});
		return changed ? next : prevNodes;
	}

	return items.map((item, index) => {
		const prev = prevNodes[index];
		if (prev?.data === item) {
			return prev.index === index ? prev : { ...prev, index };
		}
		return {
			data: item,
			index,
			expandKey: String(index),
			isParent: false,
			isChildren: false,
			nodes: [],
		};
	});
}

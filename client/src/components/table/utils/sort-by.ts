import type { SortRule, TableNode } from '../type';

function compareValues<T>(a: T, b: T, descending: boolean): number {
	if (a == null && b == null) {
		return 0;
	}
	if (a == null) {
		return descending ? -1 : 1;
	}
	if (b == null) {
		return descending ? 1 : -1;
	}
	if (a > b) {
		return descending ? -1 : 1;
	}
	if (a < b) {
		return descending ? 1 : -1;
	}
	return 0;
}

function createCompareFn<T>(
	rules: SortRule<T>[],
): (a: TableNode<T>, b: TableNode<T>) => number {
	return (nodeA, nodeB) => {
		for (const rule of rules) {
			const cmp = compareValues(
				nodeA.data[rule.key],
				nodeB.data[rule.key],
				rule.descending,
			);
			if (cmp !== 0) {
				return cmp;
			}
		}
		return 0;
	};
}

function sortNodesImmutable<T>(
	nodes: TableNode<T>[],
	fn: (a: TableNode<T>, b: TableNode<T>) => number,
): TableNode<T>[] {
	return [...nodes]
		.sort(fn)
		.map((node) => ({
			...node,
			nodes:
				Array.isArray(node.nodes) && node.nodes.length
					? sortNodesImmutable(node.nodes, fn)
					: node.nodes,
		}));
}

export function sortBy<T = object>(
	nodes: TableNode<T>[],
	key: keyof T,
	descending = false,
): TableNode<T>[] {
	return sortByRules(nodes, [{ key, descending }]);
}

export function sortByRules<T = object>(
	nodes: TableNode<T>[],
	rules: SortRule<T>[],
): TableNode<T>[] {
	if (!rules.length) {
		return nodes;
	}
	return sortNodesImmutable(nodes, createCompareFn(rules));
}

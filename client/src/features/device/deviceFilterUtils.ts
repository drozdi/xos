type DeviceFilterOption = {
	label?: string;
	sublabel?: string;
	value?: number | string;
	type?: string;
};

export type DeviceTypeSelectGroup = {
	group: string;
	items: { value: string; label: string }[];
};

function formatTypeLabel(item: DeviceFilterOption): string {
	const name = item.label ?? String(item.value ?? '');
	return item.sublabel ? `${name} (${item.sublabel})` : name;
}

export function buildDeviceTypeSelectGroups(
	items: DeviceFilterOption[],
): DeviceTypeSelectGroup[] {
	const groups: DeviceTypeSelectGroup[] = [];
	let current: DeviceTypeSelectGroup | null = null;

	for (const item of items) {
		if (item.type === 'divider') {
			current = null;
			continue;
		}
		if (item.type === 'subheader') {
			current = {
				group: item.label ?? 'Группа',
				items: [],
			};
			groups.push(current);
			continue;
		}
		if (item.value == null) {
			continue;
		}
		const option = { value: String(item.value), label: formatTypeLabel(item) };
		if (current) {
			current.items.push(option);
		} else {
			groups.push({ group: 'Прочие', items: [option] });
		}
	}

	return groups.filter((group) => group.items.length > 0);
}

export function getFirstSelectValue(groups: DeviceTypeSelectGroup[]): string | null {
	for (const group of groups) {
		const first = group.items[0];
		if (first) {
			return first.value;
		}
	}
	return null;
}

export function getByPath(obj: unknown, path: string): unknown {
	if (!path) {return obj;}
	const parts = path.split('.');
	let current: unknown = obj;
	for (const part of parts) {
		if (current === null || current === undefined || typeof current !== 'object') {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
	const parts = path.split('.');
	if (parts.length === 1) {
		obj[parts[0]!] = value;
		return;
	}
	let current: Record<string, unknown> = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]!;
		const next = current[part];
		if (next === null || next === undefined || typeof next !== 'object' || Array.isArray(next)) {
			current[part] = {};
		}
		current = current[part] as Record<string, unknown>;
	}
	current[parts[parts.length - 1]!] = value;
}

export function hasByPath(obj: unknown, path: string): boolean {
	return getByPath(obj, path) !== undefined;
}

export function removeByPath(obj: Record<string, unknown>, path: string): boolean {
	const parts = path.split('.');
	if (parts.length === 1) {
		if (!(parts[0]! in obj)) {return false;}
		delete obj[parts[0]!];
		return true;
	}
	let current: Record<string, unknown> = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]!;
		const next = current[part];
		if (next === null || next === undefined || typeof next !== 'object' || Array.isArray(next)) {
			return false;
		}
		current = next as Record<string, unknown>;
	}
	const last = parts[parts.length - 1]!;
	if (!(last in current)) {return false;}
	delete current[last];
	return true;
}

import { useCallback, useMemo, useState } from 'react';

export function useExplorerHistory(initialPath: string) {
	const [stack, setStack] = useState({ paths: [initialPath], index: 0 });

	const currentPath = stack.paths[stack.index] ?? initialPath;

	const navigate = useCallback((path: string) => {
		setStack((prev) => {
			const base = prev.paths.slice(0, prev.index + 1);
			if (base[base.length - 1] === path) {
				return prev;
			}
			const paths = [...base, path];
			return { paths, index: paths.length - 1 };
		});
	}, []);

	const canGoBack = stack.index > 0;
	const canGoForward = stack.index < stack.paths.length - 1;

	const goBack = useCallback(() => {
		setStack((prev) => (prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev));
	}, []);

	const goForward = useCallback(() => {
		setStack((prev) =>
			prev.index < prev.paths.length - 1 ? { ...prev, index: prev.index + 1 } : prev,
		);
	}, []);

	return useMemo(
		() => ({
			currentPath,
			setCurrentPath: navigate,
			navigate,
			canGoBack,
			canGoForward,
			goBack,
			goForward,
		}),
		[currentPath, navigate, canGoBack, canGoForward, goBack, goForward],
	);
}

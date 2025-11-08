import cx from 'clsx';
import {
	cloneElement,
	createContext,
	createElement,
	forwardRef,
	Fragment,
	isValidElement,
	useCallback,
	useContext,
	useMemo,
} from 'react';
import { isFunction } from '../utils/is';

// Более строгие типы
interface RenderContextValue {
	render?: (params: {
		as: React.ReactElement | string;
		to: string;
	}) => React.ReactElement | string;
}

interface RenderProviderProps extends RenderContextValue {
	children: React.ReactNode;
}

interface ApplyContextToPropsParams {
	as: React.ReactElement | string;
	to: string;
	[key: string]: unknown;
}

interface RenderProps {
	as?: React.ReactElement | string;
	children?: React.ReactNode | ((state: Record<string, unknown>) => React.ReactNode);
	if?: (state: Record<string, unknown>) => boolean;
	className?:
		| string
		| ((state: Record<string, unknown>, props: Record<string, unknown>) => string);
	style?:
		| React.CSSProperties
		| ((
				state: Record<string, unknown>,
				props: Record<string, unknown>,
		  ) => React.CSSProperties);
	[id: string]: unknown;
	'aria-labelledby'?: string;
}

type ForwardRefComponent<P, T> = React.ForwardRefExoticComponent<
	React.PropsWithoutRef<P> & React.RefAttributes<T>
> & {
	displayName?: string;
};

interface RenderFunction {
	(
		tag: React.ReactElement | string,
		props: RenderProps,
		state: Record<string, unknown>,
	): React.ReactElement | null;
}

// Константы для избежания магических строк
const CLASS_NAME = 'className';
const STYLE = 'style';
const ARIA_LABELLEDBY = 'aria-labelledby';
const DYNAMIC_PROPS = [CLASS_NAME, STYLE] as const;

// Мемоизированный контекст по умолчанию
const defaultContextValue: RenderContextValue = {
	render: useCallback(({ as, to }) => (to ? 'a' : as), []),
};

const RenderContext = createContext<RenderContextValue>(defaultContextValue);

// Оптимизированный провайдер с мемоизацией значения
export function RenderProvider({ children, ...contextValues }: RenderProviderProps) {
	const contextValue = useMemo(() => contextValues, [contextValues.render]);

	return (
		<RenderContext.Provider value={contextValue}>{children}</RenderContext.Provider>
	);
}

export function useRenderContext(): RenderContextValue {
	return useContext(RenderContext);
}

// Оптимизированная функция forwardRefWithAs
export function forwardRefWithAs<P, T = unknown>(
	component: React.ForwardRefRenderFunction<T, P>,
): ForwardRefComponent<P, T> {
	const forwarded = forwardRef(component);
	forwarded.displayName = component.displayName ?? component.name;
	return forwarded as ForwardRefComponent<P, T>;
}

// Мемоизированная функция применения контекста
function useApplyContextToProps(props: ApplyContextToPropsParams) {
	const { render = defaultContextValue.render!, ...contextValues } = useRenderContext();

	return useMemo(
		() => ({
			...contextValues,
			...props,
			as: render(props),
			render: undefined,
		}),
		[contextValues, props, render],
	);
}

// Вспомогательная функция для обработки динамических пропсов
function useProcessDynamicProps(
	rest: Record<string, unknown>,
	state: Record<string, unknown>,
	component: React.ReactElement | string,
) {
	return useMemo(() => {
		const result = { ...rest };

		for (const key of DYNAMIC_PROPS) {
			const value = result[key];
			if (value && isFunction(value)) {
				if (isValidElement(component) && (component.type as any).render) {
					result[key] = (arg: unknown) =>
						(value as Function)({ ...arg, ...state }, rest);
				} else {
					result[key] = (value as Function)(state || {}, rest);
				}
			}
		}

		if (result[ARIA_LABELLEDBY] && result[ARIA_LABELLEDBY] === result.id) {
			delete result[ARIA_LABELLEDBY];
		}

		return result;
	}, [rest, state, component]);
}

// Оптимизированная функция рендера
export const render: RenderFunction = (tag, props, state) => {
	const appliedProps = useApplyContextToProps({
		as: props.as ?? tag,
		to: props.to ?? '',
		...props,
	});

	const { as: Component, children, if: _if, ...rest } = appliedProps;

	// Ранний возврат для условий
	if (_if?.(state) === false || !Component) {
		return null;
	}

	const memoizedRest = useProcessDynamicProps(rest, state, Component);

	const resolvedChildren = useMemo(
		() => (isFunction(children) ? children(state) : children),
		[children, state],
	);

	// Обработка Fragment
	if (Component === Fragment) {
		if (!isValidElement(resolvedChildren)) {
			return createElement(Fragment, memoizedRest, resolvedChildren);
		}

		const childProps = resolvedChildren.props ?? {};
		const { className: childClassName, style: childStyle } = childProps;

		const newClassName = cx(
			isFunction(childClassName)
				? childClassName(state, memoizedRest.className)
				: childClassName,
			memoizedRest.className,
		);

		const newStyle = {
			...(isFunction(childStyle)
				? childStyle(state, memoizedRest.style)
				: childStyle),
			...(memoizedRest.style as React.CSSProperties),
		};

		return cloneElement(resolvedChildren, {
			...memoizedRest,
			className: newClassName,
			style: newStyle,
		});
	}

	return createElement(Component, memoizedRest, resolvedChildren);
};

render.displayName = 'internal/render';

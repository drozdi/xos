import React from 'react'

type SetStateHandler<T> = {
	_(partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false): void
	_(state: T | ((state: T) => T), replace: true): void
}['_']

export interface StoreApi<T> {
	setState: SetStateHandler<T>
	getState: () => T
	getInitialState: () => T
	subscribe: (listener: (state: T, prevState: T) => void) => () => void
}

export type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type Get<T, K, F> = K extends keyof T ? T[K] : F

export type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]
	? S
	: Ms extends []
	? S
	: Ms extends [[infer Mi, infer Ma], ...infer Mrs]
	? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
	: never

export type StateCreator<
	T,
	Mis extends [StoreMutatorIdentifier, unknown][] = [],
	Mos extends [StoreMutatorIdentifier, unknown][] = [],
	U = T
> = ((
	setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
	getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
	store: Mutate<StoreApi<T>, Mis>
) => U) & { $$storeMutators?: Mos }

export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

type CreateStore = {
	<T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], Mos>): Mutate<
		StoreApi<T>,
		Mos
	>

	<T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
		initializer: StateCreator<T, [], Mos>
	) => Mutate<StoreApi<T>, Mos>
}

type CreateStoreImpl = <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
	initializer: StateCreator<T, [], Mos>
) => Mutate<StoreApi<T>, Mos>

const createStoreImpl: CreateStoreImpl = createState => {
	type TState = ReturnType<typeof createState>
	type Listener = (state: TState, prevState: TState) => void
	let state: TState
	const listeners: Set<Listener> = new Set()

	const setState: StoreApi<TState>['setState'] = (partial, replace) => {
		const nextState = typeof partial === 'function' ? (partial as (state: TState) => TState)(state) : partial
		if (!Object.is(nextState, state)) {
			const previousState = state
			state =
				replace ?? (typeof nextState !== 'object' || nextState === null)
					? (nextState as TState)
					: Object.assign({}, state, nextState)
			listeners.forEach(listener => listener(state, previousState))
		}
	}

	const getState: StoreApi<TState>['getState'] = () => state

	const getInitialState: StoreApi<TState>['getInitialState'] = () => initialState

	const subscribe: StoreApi<TState>['subscribe'] = listener => {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}

	const api = { setState, getState, getInitialState, subscribe }
	const initialState = (state = createState(setState, getState, api))
	return api as any
}

export const createStore = (createState =>
	createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, 'getState' | 'getInitialState' | 'subscribe'>

const identity = <T>(arg: T): T => arg
export function useStore<S extends ReadonlyStoreApi<unknown>>(api: S): ExtractState<S>

export function useStore<S extends ReadonlyStoreApi<unknown>, U>(api: S, selector: (state: ExtractState<S>) => U): U

export function useStore<TState, StateSlice>(
	api: ReadonlyStoreApi<TState>,
	selector: (state: TState) => StateSlice = identity as any
) {
	const slice = React.useSyncExternalStore(
		api.subscribe,
		React.useCallback(() => selector(api.getState()), [api, selector]),
		React.useCallback(() => selector(api.getInitialState()), [api, selector])
	)
	React.useDebugValue(slice)
	return slice
}

export type UseBoundStore<S extends ReadonlyStoreApi<unknown>> = {
	(): ExtractState<S>
	<U>(selector: (state: ExtractState<S>) => U): U
} & S

type Create = {
	<T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], Mos>): UseBoundStore<
		Mutate<StoreApi<T>, Mos>
	>
	<T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
		initializer: StateCreator<T, [], Mos>
	) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
}

const createImpl = <T>(createState: StateCreator<T, [], []>) => {
	const api = createStore(createState)

	const useBoundStore: any = (selector?: any) => useStore(api, selector)

	Object.assign(useBoundStore, api)

	return useBoundStore
}

export const createContext = (<T>(createState: StateCreator<T, [], []> | undefined) =>
	createState ? createImpl(createState) : createImpl) as Create

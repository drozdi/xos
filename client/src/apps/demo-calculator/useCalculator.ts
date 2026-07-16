import { useCallback, useEffect, useReducer, useRef } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useWmStore } from '@/core/windowManager/useWmStore';

import {
	getCalculatorSubtitle,
	getCalculatorTitle,
	INITIAL_CALCULATOR_STATE,
	mapKeyboardKey,
	pressCalculatorKey,
	shouldPreventKeyboardDefault,
	type CalculatorState,
} from './calculatorLogic';

function calculatorReducer(state: CalculatorState, key: string): CalculatorState {
	return pressCalculatorKey(state, key);
}

export function useCalculator() {
	const [state, dispatch] = useReducer(calculatorReducer, INITIAL_CALCULATOR_STATE);
	const { windowId } = useAppContext();
	const activeWindowId = useWmStore((store) => store.activeWindowId);
	const isActive = activeWindowId === windowId;
	const pressRef = useRef<(key: string) => void>(() => {});

	const pressKey = useCallback((key: string) => {
		dispatch(key);
	}, []);

	pressRef.current = pressKey;

	useEffect(() => {
		if (!isActive) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			const mapped = mapKeyboardKey(event.key);
			if (!mapped) {
				return;
			}
			if (shouldPreventKeyboardDefault(event.key)) {
				event.preventDefault();
			}
			pressRef.current(mapped);
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isActive]);

	return {
		state,
		pressKey,
		title: getCalculatorTitle(state),
		subtitle: getCalculatorSubtitle(state),
	};
}

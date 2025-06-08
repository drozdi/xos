import { useEffect, useMemo, useState } from 'react';
import { Window } from '../../components/window';
import { useApp } from '../../core/app-system/context';

import { Box, Button, Group } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { isObject } from '../../utils/is';

const zeroDivisionError = "Can't divide with 0";
const matrix = [
	['C', '+-', '%', '/'],
	[7, 8, 9, '*'],
	[4, 5, 6, '-'],
	[1, 2, 3, '+'],
	[0, '.', '='],
];

export function AppCalculator() {
	const $app = useApp();
	const [{ expr1, expr2, prev, sign }, updateOperand] = useSetState({
		expr1: '0',
		expr2: '',
		sign: '',
		prev: '',
	});
	const [disabled, setDisabled] = useState([]);
	const disable = () => {
		setDisabled(['+-', '%', '/', '*', '+', '-', '.']);
	};
	const enable = () => {
		setDisabled([]);
	};

	const handleClickReset = (num = '0') => {
		updateOperand({ expr1: num, expr2: '', sign: '', prev: '' });
		enable();
	};
	const handleClickNum = (num) => {
		if (prev) {
			handleClickReset(num);
			return;
		}
		if (sign) {
			updateOperand({
				expr2: expr2 ? expr2 + num : String(num || ''),
			});
		} else {
			updateOperand({
				expr1: expr1 !== '0' ? expr1 + num : String(num || ''),
			});
		}
	};
	const handleClickEqual = () => {
		let num1 = +expr1;
		let num2 = +expr2;
		updateOperand({
			prev: `${expr1} ${sign} ${expr2}`,
		});
		switch (sign) {
			case '+':
				updateOperand({
					expr1: String(num1 + num2),
				});
				break;
			case '-':
				updateOperand({
					expr1: String(num1 - num2),
				});
				break;
			case '*':
				updateOperand({
					expr1: String(num1 * num2),
				});
				break;
			case '/':
				if (!num2) {
					updateOperand({
						expr2: zeroDivisionError,
						prev: '',
					});
					disable();
					break;
				}
				updateOperand({
					expr1: String(num1 / num2),
				});
				break;
		}
	};
	const handleClickSign = (sign) => {
		updateOperand({ sign, expr2: '', prev: '' });
	};
	const handleClickInvert = () => {
		if (prev || !sign) {
			updateOperand({
				expr1: +expr1 * -1,
			});
		} else if (sign) {
			updateOperand({
				expr2: +expr2 * -1,
			});
		}
	};

	const handleClickPercent = () => {
		if (sign === '') {
			handleClickReset();
			handleClickEqual();
			return;
		}
		if ('+-'.split('').includes(sign)) {
			updateOperand({
				expr2: +expr1 * (+expr2 / 100),
			});
			handleClickEqual();
			updateOperand({
				prev: `${expr1} ${sign} ${expr2}%`,
			});
			return;
		}
		if ('*/'.split('').includes(sign)) {
			updateOperand({
				expr2: +expr2 / 100,
			});
			return;
		}
	};
	const handleClickComa = () => {
		if (sign && !expr2.includes('.')) {
			updateOperand({
				expr2: expr2 ? expr2 + '.' : '0.',
			});
		} else if (!expr1.includes('.')) {
			updateOperand({
				expr1: expr1 ? expr1 + '.' : '0.',
			});
		}
	};

	const handleClickButton = (num) => {
		if (num === 'C' || expr2 === zeroDivisionError) {
			handleClickReset(num !== 'C' ? num : '0');
		} else if (num === '+-') {
			handleClickInvert();
		} else if (num === '=') {
			handleClickEqual();
		} else if (num === '%') {
			handleClickPercent();
		} else if ('+-*/'.includes(num)) {
			handleClickSign(num);
		} else if ('.,'.includes(num)) {
			handleClickComa();
		} else {
			handleClickNum(num);
		}
	};

	const title = useMemo(() => {
		if (!sign || prev) {
			return expr1;
		}
		return expr2;
	}, [expr1, expr2, sign, prev]);

	const subTitle = useMemo(() => {
		if (!sign) {
			return '';
		}
		if (prev) {
			return prev;
		}
		return `${expr1} ${sign}`;
	}, [expr1, prev, sign]);

	const onKeyPress = (event) => {
		//console.log(event);
		event.stopPropagation();
		event.preventDefault();
		const key = event.key;

		if (key === 'Enter') {
			handleClickButton('=');
		} else if (key === 'Backspace') {
			handleClickButton('C');
		} else if ('0123456789+-*/,.%'.includes(key)) {
			handleClickButton(key);
		}
	};

	useEffect(() => {
		const handleKeyPress = (event) => onKeyPress(event);

		const onActivated = () => {
			//console.log("activated");
			document.addEventListener('keydown', handleKeyPress);
		};

		const onDeactivated = () => {
			//console.log("deactivated");
			document.removeEventListener('keydown', handleKeyPress);
		};

		// Подписываемся на события активации и деактивации
		$app?.on('activated', onActivated);
		$app?.on('deactivated', onDeactivated);

		// Инициализация: если приложение уже активно, добавляем обработчик
		if ($app?.isActive) {
			onActivated();
		}

		return () => {
			$app?.emit('deactivated');
			$app?.off('activated', onActivated);
			$app?.off('deactivated', onDeactivated);
		};
	}, [expr1, expr2, prev, sign, $app]);

	return (
		<Window
			title="Калькулятор"
			h={370}
			draggable
			onReload={() => handleClickReset()}
			icons="reload collapse close"
		>
			<Box col>
				<Box className="items-end">
					<Box className="opacity-80">
						{'\u00A0'}
						{subTitle}
					</Box>
					<Box className="text-3xl">
						{'\u00A0'}
						{title}
					</Box>
				</Box>
				{matrix.map((lines, index) => (
					<Group grow pills key={index}>
						{lines.map((num, index) => {
							const key = {
								span: 1,
								...(isObject(num)
									? num
									: {
											value: num,
										}),
							};
							return (
								<Button
									key={index}
									className={
										num === '='
											? 'w-[calc(50%+6*var(--spacing))]'
											: 'w-1/4'
									}
									color={index === 3 || num === '=' ? 'accent' : 'info'}
									onClick={() => handleClickButton(`${num}`)}
									disabled={disabled.includes(num)}
								>
									{num}
								</Button>
							);
						})}
					</Group>
				))}
			</Box>
		</Window>
	);
}

AppCalculator.displayName = 'apps/calculator/app';

export default AppCalculator;

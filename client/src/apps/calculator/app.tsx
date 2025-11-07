import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Window } from '../../components/window';
import { useApp } from '../../core/app-system';

import { Box, Button, Grid, Stack, Text } from '@mantine/core';
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
	const disable = useCallback(() => {
		setDisabled(['+-', '%', '/', '*', '+', '-', '.']);
	}, []);
	const enable = useCallback(() => {
		setDisabled([]);
	}, []);

	const handleClickReset = useCallback((num = '0') => {
		updateOperand({ expr1: num, expr2: '', sign: '', prev: '' });
		enable();
	}, []);
	const handleClickNum = useCallback(
		(num) => {
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
		},
		[expr1, expr2, sign],
	);
	const handleClickEqual = useCallback(() => {
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
	}, [expr1, expr2, sign]);
	const handleClickSign = useCallback((sign) => {
		updateOperand({ sign, expr2: '', prev: '' });
	}, []);
	const handleClickInvert = useCallback(() => {
		if (prev || !sign) {
			updateOperand({
				expr1: +expr1 * -1,
			});
		} else if (sign) {
			updateOperand({
				expr2: +expr2 * -1,
			});
		}
	}, [expr1, expr2, sign, prev]);

	const handleClickPercent = useCallback(() => {
		if (sign === '') {
			handleClickReset();
			handleClickEqual();
			return;
		}
		if ('+-'.includes(sign)) {
			updateOperand({
				expr2: +expr1 * (+expr2 / 100),
			});
			handleClickEqual();
			updateOperand({
				prev: `${expr1} ${sign} ${expr2}%`,
			});
			return;
		}
		if ('*/'.includes(sign)) {
			updateOperand({
				expr2: +expr2 / 100,
			});
			return;
		}
	}, [sign, expr1, expr2, prev]);
	const handleClickComa = useCallback(() => {
		if (sign && !expr2.includes('.')) {
			updateOperand({
				expr2: expr2 ? expr2 + '.' : '0.',
			});
		} else if (!expr1.includes('.')) {
			updateOperand({
				expr1: expr1 ? expr1 + '.' : '0.',
			});
		}
	}, [expr1, expr2, sign]);

	const handleClickButton = useCallback(
		(num) => {
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
		},
		[
			expr2,
			handleClickReset,
			handleClickInvert,
			handleClickEqual,
			handleClickPercent,
			handleClickSign,
			handleClickComa,
			handleClickNum,
		],
	);

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

	const handlerRef = useRef();
	handlerRef.current = (event) => {
		let key = event.key;

		// Преобразуем запятую в точку для десятичных дробей
		if (key === ',') {
			key = '.';
		}

		// Обрабатываем специальные клавиши
		if (key === 'Enter' || key === '=') {
			handleClickButton('=');
		} else if (key === 'Escape' || key === 'Delete' || key === 'Backspace') {
			handleClickButton('C');
		} else if (key === 'x' || key === 'X') {
			handleClickButton('*'); // Поддержка "x" как умножения
		} else if ('0123456789+-*/.%'.includes(key)) {
			handleClickButton(key);
		}
	};

	useEffect(() => {
		const handleKeyDown = (event) => {
			// Предотвращаем стандартное поведение браузера
			if (/[0-9+\-*/.%,=]|Enter|Escape|Backspace|Delete/.test(event.key)) {
				event.preventDefault();
			}
			handlerRef.current(event);
		};

		const onActivated = () => document.addEventListener('keydown', handleKeyDown);
		const onDeactivated = () =>
			document.removeEventListener('keydown', handleKeyDown);
		// Подписываемся на события активации и деактивации
		$app?.on('activated', onActivated);
		$app?.on('deactivated', onDeactivated);

		// Инициализация: если приложение уже активно, добавляем обработчик
		if ($app?.isActive) {
			onActivated();
		}

		return () => {
			onDeactivated();
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
			<Stack gap="xs">
				<Box
					px="0.5rem"
					style={{
						userSelect: 'none',
					}}
				>
					<Text ta="right" opacity={0.8} size="md">
						{'\u00A0'}
						{subTitle}
					</Text>
					<Text ta="right" size="lg">
						{'\u00A0'}
						{title}
					</Text>
				</Box>
				<Grid gutter={0}>
					{matrix.map((lines, index) => {
						return lines.map((num, index) => {
							const key = {
								span: 1,
								...(isObject(num)
									? num
									: {
											value: num,
										}),
							};
							return (
								<Grid.Col
									key={index}
									p={3}
									span={num === '=' ? '6' : '3'}
								>
									<Button
										fullWidth
										color={
											index === 3 || num === '='
												? 'violet'
												: 'indigo'
										}
										variant="filled"
										radius={0}
										onClick={() => handleClickButton(`${num}`)}
										disabled={disabled.includes(num)}
									>
										{num}
									</Button>
								</Grid.Col>
							);
						});
					})}
				</Grid>
			</Stack>
		</Window>
	);
}

AppCalculator.displayName = 'apps/calculator/app';

export default AppCalculator;

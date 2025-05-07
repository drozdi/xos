import { Box, Flex } from '@mantine/core';
import PropTypes from 'prop-types';
import React, { forwardRef, useMemo } from 'react';

/**
 * Функция для преобразования строки в компонент Section
 *
 * @param {string | React.ReactElement} section - Секция
 * @returns {null | React.ReactElement} Преобразованная секция
 */
const processSection = (
	section?: React.ReactNode | undefined,
): React.ReactNode | null => {
	return useMemo(() => {
		if (!section) {
			return null;
		}
		return (
			<Flex wrap="wrap" direction="column" justify="center" align="center">
				{section}
			</Flex>
		);
	}, [section]);
};

export interface SectionsProps {
	children: React.ReactNode;
	leftSection?: React.ReactNode | string;
	rightSection?: React.ReactNode | string;
	className?: string;
}

/**
* Компонент для создания гибкой структуры с возможностью размещения элементов в колонки.

* @type {React.ForwardRefExoticComponent}
* @param {object} props - свойства
* @param {string|Function} [props.className] - классы
* @param {string} [props.bodyClass] - классы для тела
* @param {boolean} [props.noPadding] - флаг для отключения отступов
* @param {boolean} [props.col] - флаг для вертикального расположения элементов
* @param {boolean} [props.row] - флаг для горизонтального расположения элементов
* @param {boolean} [props.noWrap] - флаг для отключения переноса элементов на новую строку
* @param {boolean} [props.dense] - флаг для плотного расположения элементов
* @param {boolean} [props.square] - флаг для квадратного расположения элементов
* @param {string} [props.size] - размер элементов
* @param {string} [props.align] - выравнивание элементов по вертикали
* @param {string} [props.justify] - выравнивание элементов по горизонтали
* @param {React.ReactNode} [props.children] - дочерние элементы
* @param {string|React.ReactElement} [props.leftSection] - левый раздел
* @param {string|React.ReactElement} [props.rightSection] - правый раздел
* @param {React.Ref} ref - ссылка
* @returns {React.ReactElement} элемент Sections
*/
export const Sections = forwardRef(
	(
		{ children, leftSection, rightSection, className, ...props }: SectionsProps,
		ref,
	) => {
		return (
			<Flex px="md" py="xs" {...props} className={className} gap="md" ref={ref}>
				{processSection(leftSection)}
				<Box component={Flex} align="center" flex={1}>
					{children}
				</Box>
				{processSection(rightSection)}
			</Flex>
		);
	},
);
Sections.propTypes = {
	children: PropTypes.node,
	leftSection: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
	rightSection: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
	classNames: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};

Sections.displayName = 'internal/Sections';

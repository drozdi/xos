import { Box, Flex, FlexProps } from '@mantine/core';
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

export interface SectionsProps extends FlexProps {
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
				<Flex component={Box} align="center" flex={1}>
					{children}
				</Flex>
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

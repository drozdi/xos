import { createTheme } from '@mantine/core'

export const themeMantine = createTheme({
	primaryColor: 'blue',
	colors: {
		primary: [
			'#e6f6ff',
			'#d2e7fd',
			'#a6cdf4',
			'#77b1ed',
			'#509ae7',
			'#378be4',
			'#2884e4',
			'#1975d2',
			'#0864b6',
			'#0057a2',
		],
		secondary: [
			'#e2f9ff',
			'#ceedff',
			'#9fd8fb',
			'#5cbbf6',
			'#44aff3',
			'#2aa4f2',
			'#169ef2',
			'#0089d8',
			'#007ac3',
			'#006aad',
		],
		success: [
			'#ebfbeb',
			'#dbf2dc',
			'#b9e1ba',
			'#93d096',
			'#74c277',
			'#5fb963',
			'#4caf50',
			'#439e47',
			'#398d3d',
			'#2b7a31',
		],
		accent: [
			'#feecff',
			'#f3d7f8',
			'#e4aeed',
			'#d481e2',
			'#c75bd9',
			'#bf44d4',
			'#bb37d2',
			'#9c27b0',
			'#9322a6',
			'#801892',
		],
		warning: [
			'#ffeaed',
			'#fed5d9',
			'#f3a9b0',
			'#e97b85',
			'#e15361',
			'#dc3545',
			'#dc2c3e',
			'#c31e30',
			'#af1629',
			'#9a0822',
		],
		info: [
			'#e2f7ff',
			'#cdeaff',
			'#9dd3fc',
			'#6abaf8',
			'#40a5f5',
			'#2196f3',
			'#0b91f4',
			'#007dda',
			'#006fc4',
			'#0060ae',
		],
		danger: [
			'#fff5e1',
			'#ffeacc',
			'#ffd39a',
			'#ffbb64',
			'#ffa637',
			'#ff991b',
			'#fb8c00',
			'#e37e00',
			'#cb7000',
			'#b15f00',
		],
		// dark: [
		// 	'#f5f5f5',
		// 	'#e7e7e7',
		// 	'#cdcdcd',
		// 	'#b2b2b2',
		// 	'#9a9a9a',
		// 	'#8b8b8b',
		// 	'#848484',
		// 	'#717171',
		// 	'#656565',
		// 	'#1d1d1d',
		// ],
	},
	breakpoints: {
		xs: '30em',
		sm: '48em',
		md: '64em',
		lg: '74em',
		xl: '90em',
	},
	fontSizes: {
		xs: '0.75rem', // 12px
		sm: '0.875rem', // 14px
		md: '1rem', // 16px
		lg: '1.125rem', // 18px
		xl: '1.25rem', // 20px
	},
	lineHeights: {
		xs: 'calc(1 / 0.75)',
		sm: 'calc(1.25 / 0.875)',
		md: 'calc(1.5 / 1)',
		lg: 'calc(1.75 / 1.125)',
		xl: 'calc(1.75 / 1.25)',
	},
	spacing: {
		base: '0.25rem',
		xs: '0.5rem',
		sm: '0.75rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
	},
	headings: {
		sizes: {
			h1: { fontSize: '2.5rem', lineHeight: 'calc(1/2.5rem)' },
			h2: { fontSize: '2rem', lineHeight: 'calc(1/2rem' },
			h3: { fontSize: '1.75rem', lineHeight: 'calc(1/1.75rem)' },
			h4: { fontSize: '1.5rem', lineHeight: 'calc(1/1.5rem)' },
			h5: { fontSize: '1.25rem', lineHeight: 'calc(1/1.25rem)' },
			h6: { fontSize: '1rem', lineHeight: 'calc(1/1rem)' },
		},
	},
	radius: {
		xs: '0.125rem', // 2px
		sm: '0.25rem', // 4px
		md: '0.375rem', // 6px
		lg: '0.5rem', // 8px
		xl: '0.75rem', // 12px
	},
	shadows: {
		xs: '0 1px rgb(0 0 0 / 0.05)',
		sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
		lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
		xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) ',
	},
})

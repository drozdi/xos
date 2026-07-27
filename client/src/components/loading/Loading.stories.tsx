import { Badge, Button, Card, Group, Image, Text } from '@mantine/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Loading, type LoadingProps } from './loading'

const meta = {
	title: 'Shared/Loading',
	component: Loading,
	tags: ['autodocs', 'test'],
	parameters: {
		layout: 'centered',
	},
	args: {
		active: false,
		keepMounted: true,
	},
	argTypes: {
		active: {
			control: {
				type: 'boolean',
			},
			table: {
				defaultValue: {
					summary: 'false',
				},
			},
		},
		keepMounted: {
			control: {
				type: 'boolean',
			},
			table: {
				defaultValue: {
					summary: 'true',
				},
			},
		},
	},
} satisfies Meta<LoadingProps>

export default meta

type Story = StoryObj<typeof meta>

export const Usage: Story = {
	render: props => {
		return (
			<div style={{ width: '500px', margin: 'auto', padding: '40px' }}>
				<Loading {...props}>
					<Card shadow='sm' padding='lg' radius='md' withBorder>
						<Card.Section>
							<Image
								src='https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png'
								height={160}
								alt='Norway'
							/>
						</Card.Section>

						<Group justify='space-between' mt='md' mb='xs'>
							<Text fw={500}>Norway Fjord Adventures</Text>
							<Badge color='pink'>On Sale</Badge>
						</Group>

						<Text size='sm' c='dimmed'>
							With Fjord Tours you can explore more of the magical fjord landscapes with tours and activities on and
							around the fjords of Norway
						</Text>

						<Button color='blue' fullWidth mt='md' radius='md'>
							Book classic tour now
						</Button>
					</Card>
				</Loading>
			</div>
		)
	},
}

export const Active: Story = {
	args: {
		active: true,
	},
	render: Usage.render,
}

export const WithSkeleton: Story = {
	args: {
		active: true,
		skeleton: <Card shadow='sm' padding='lg' radius='md' withBorder h={280} />,
	},
	render: Usage.render,
}

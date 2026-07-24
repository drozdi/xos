import { Badge, Button, Card, Flex, Image, Typography } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loading, type LoadingProps } from './loading';

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
} satisfies Meta<LoadingProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Usage: Story = {
	render: (props) => {
		return (
			<div style={{ width: '500px', margin: 'auto', padding: '40px' }}>
				<Loading {...props}>
					<Card cover={<Image alt="Norway" height={160} src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png" />}>
						<Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
							<Typography.Text strong>Norway Fjord Adventures</Typography.Text>
							<Badge color="magenta">On Sale</Badge>
						</Flex>
						<Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
							With Fjord Tours you can explore more of the magical fjord landscapes with tours and
							activities on and around the fjords of Norway
						</Typography.Paragraph>
						<Button type="primary" block>
							Book classic tour now
						</Button>
					</Card>
				</Loading>
			</div>
		);
	},
};

export const Active: Story = {
	args: {
		active: true,
	},
	render: Usage.render,
};

export const WithSkeleton: Story = {
	args: {
		active: true,
		skeleton: <Card style={{ height: 280 }} />,
	},
	render: Usage.render,
};

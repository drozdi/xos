import { Alert, Button, Flex, Typography } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface WindowErrorBoundaryProps {
	children: ReactNode;
	onReset?: () => void;
}

interface WindowErrorBoundaryState {
	hasError: boolean;
	message: string;
}

export class WindowErrorBoundary extends Component<
	WindowErrorBoundaryProps,
	WindowErrorBoundaryState
> {
	override state: WindowErrorBoundaryState = {
		hasError: false,
		message: '',
	};

	static getDerivedStateFromError(error: Error): WindowErrorBoundaryState {
		return {
			hasError: true,
			message: error.message || 'Unknown error',
		};
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('[WindowErrorBoundary]', error, errorInfo);
	}

	private handleReset = (): void => {
		this.setState({ hasError: false, message: '' });
		this.props.onReset?.();
	};

	override render(): ReactNode {
		if (this.state.hasError) {
			return (
				<Flex
					vertical
					gap="small"
					justify="center"
					style={{ height: '100%', padding: 16 }}
				>
					<Alert
						type="error"
						showIcon
						message="Window content error"
						description={
							<Typography.Text style={{ fontSize: 13 }}>{this.state.message}</Typography.Text>
						}
					/>
					<Button size="small" type="primary" ghost onClick={this.handleReset}>
						Try again
					</Button>
				</Flex>
			);
		}

		return this.props.children;
	}
}

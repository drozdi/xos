import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';

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
				<Stack p="md" gap="sm" h="100%" justify="center">
					<Alert color="red" title="Window content error">
						<Text size="sm">{this.state.message}</Text>
					</Alert>
					<Button size="xs" variant="light" onClick={this.handleReset}>
						Try again
					</Button>
				</Stack>
			);
		}

		return this.props.children;
	}
}

import { Badge, Group } from '@mantine/core';

interface TagBadgeListProps {
	tags: string[];
	emptyLabel?: string;
}

export function TagBadgeList({ tags, emptyLabel = 'Нет тегов' }: TagBadgeListProps) {
	if (tags.length === 0) {
		return (
			<Badge variant="light" color="gray" size="sm">
				{emptyLabel}
			</Badge>
		);
	}

	return (
		<Group gap={6}>
			{tags.map((tag) => (
				<Badge key={tag} variant="light" color="blue" size="sm">
					#{tag}
				</Badge>
			))}
		</Group>
	);
}

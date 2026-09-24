export const CONTENT_TYPE_CODE = 'content';
export const NOTES_BLOCK_CODE = 'notes';
export const RECIPES_BLOCK_CODE = 'recipes';

export const CONTENT_PROPS = {
	COVER: 'COVER',
	TAGS: 'TAGS',
	PREP_MIN: 'PREP_MIN',
	COOK_MIN: 'COOK_MIN',
	SERVINGS: 'SERVINGS',
	DIFFICULTY: 'DIFFICULTY',
	INGREDIENTS: 'INGREDIENTS',
} as const;

export const DIFFICULTY_OPTIONS = [
	{ value: 'easy', label: 'Легко' },
	{ value: 'medium', label: 'Средне' },
	{ value: 'hard', label: 'Сложно' },
] as const;

export const CONTENT_TYPE_CODE = 'content';
export const NOTES_BLOCK_CODE = 'notes';
export const RECIPES_BLOCK_CODE = 'recipes';
export const ARTICLES_BLOCK_CODE = 'articles';
export const FAQ_BLOCK_CODE = 'faq';
export const GALLERY_BLOCK_CODE = 'gallery';
export const EVENTS_BLOCK_CODE = 'events';
export const CONTACTS_BLOCK_CODE = 'contacts';
export const SERVICES_BLOCK_CODE = 'services';
export const IDEAS_BLOCK_CODE = 'ideas';
export const LEADS_BLOCK_CODE = 'leads';

export const CONTENT_PROPS = {
	COVER: 'COVER',
	TAGS: 'TAGS',
	PREP_MIN: 'PREP_MIN',
	COOK_MIN: 'COOK_MIN',
	SERVINGS: 'SERVINGS',
	DIFFICULTY: 'DIFFICULTY',
	INGREDIENTS: 'INGREDIENTS',
	CAPTION: 'CAPTION',
	PLACE: 'PLACE',
	EVENT_DATE: 'EVENT_DATE',
	POSITION: 'POSITION',
	PHONE: 'PHONE',
	EMAIL: 'EMAIL',
	PRICE: 'PRICE',
	STATUS: 'STATUS',
	STAGE: 'STAGE',
	PRIORITY: 'PRIORITY',
	CONTACT: 'CONTACT',
} as const;

export const DIFFICULTY_OPTIONS = [
	{ value: 'easy', label: 'Легко' },
	{ value: 'medium', label: 'Средне' },
	{ value: 'hard', label: 'Сложно' },
] as const;

export const IDEA_STATUS_OPTIONS = [
	{ value: 'new', label: 'Новая' },
	{ value: 'doing', label: 'В работе' },
	{ value: 'done', label: 'Готово' },
	{ value: 'dropped', label: 'Отменена' },
] as const;

export const IDEA_PRIORITY_OPTIONS = [
	{ value: 'low', label: 'Низкий' },
	{ value: 'medium', label: 'Средний' },
	{ value: 'high', label: 'Высокий' },
] as const;

export const LEAD_STAGE_OPTIONS = [
	{ value: 'new', label: 'Новый' },
	{ value: 'contacted', label: 'На связи' },
	{ value: 'qualified', label: 'Квалифицирован' },
	{ value: 'won', label: 'Выигран' },
	{ value: 'lost', label: 'Потерян' },
] as const;

export const LEAD_PRIORITY_OPTIONS = [
	{ value: 'low', label: 'Низкий' },
	{ value: 'medium', label: 'Средний' },
	{ value: 'high', label: 'Высокий' },
] as const;

export type ContentExtraField =
	| { type: 'text'; prop: string; label: string }
	| { type: 'number'; prop: string; label: string }
	| {
			type: 'select';
			prop: string;
			label: string;
			options: ReadonlyArray<{ value: string; label: string }>;
	  };

export interface ContentCatalogConfig {
	blockCode: string;
	listAppId: string;
	detailAppId: string;
	listTitle: string;
	detailTitle: string;
	entityLabel: string;
	createLabel: string;
	sectionLabel: string;
	storageKey: string;
	codeFallback: string;
	nameLabel?: string;
	previewLabel?: string;
	detailTextLabel?: string;
	features?: {
		cover?: boolean | { multiple?: boolean };
		tags?: boolean;
		preview?: boolean;
		markdown?: boolean;
		share?: boolean;
	};
	extraFields?: ContentExtraField[];
	/** Start Menu / list button to manage sections (e.g. notebooks) */
	sectionsAppId?: string;
	sectionsButtonLabel?: string;
}

export function contentFeatures(config: ContentCatalogConfig) {
	const f = config.features ?? {};
	const cover = f.cover === false ? false : f.cover === true || f.cover == null ? { multiple: true } : f.cover;
	return {
		cover,
		tags: f.tags !== false,
		preview: f.preview !== false,
		markdown: f.markdown !== false,
		share: f.share !== false,
	};
}

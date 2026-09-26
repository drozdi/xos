import {
	ARTICLES_BLOCK_CODE,
	CONTACTS_BLOCK_CODE,
	CONTENT_PROPS,
	EVENTS_BLOCK_CODE,
	FAQ_BLOCK_CODE,
	GALLERY_BLOCK_CODE,
	IDEA_PRIORITY_OPTIONS,
	IDEA_STATUS_OPTIONS,
	IDEAS_BLOCK_CODE,
	LEAD_PRIORITY_OPTIONS,
	LEAD_STAGE_OPTIONS,
	LEADS_BLOCK_CODE,
	NOTES_BLOCK_CODE,
	SERVICES_BLOCK_CODE,
	type ContentCatalogConfig,
} from './contentCatalog';

export const notesCatalogConfig: ContentCatalogConfig = {
	blockCode: NOTES_BLOCK_CODE,
	listAppId: 'notes',
	detailAppId: 'note',
	listTitle: 'Заметки',
	detailTitle: 'Заметка',
	entityLabel: 'Заметка',
	createLabel: 'Новая заметка',
	sectionLabel: 'Блокнот',
	storageKey: 'notes-catalog',
	codeFallback: 'note',
	sectionsAppId: 'notebooks',
	sectionsButtonLabel: 'Блокноты',
};

export const articlesCatalogConfig: ContentCatalogConfig = {
	blockCode: ARTICLES_BLOCK_CODE,
	listAppId: 'articles',
	detailAppId: 'article',
	listTitle: 'Статьи',
	detailTitle: 'Статья',
	entityLabel: 'Статья',
	createLabel: 'Новая статья',
	sectionLabel: 'Рубрика',
	storageKey: 'articles-catalog',
	codeFallback: 'article',
};

export const faqCatalogConfig: ContentCatalogConfig = {
	blockCode: FAQ_BLOCK_CODE,
	listAppId: 'faqs',
	detailAppId: 'faq',
	listTitle: 'FAQ',
	detailTitle: 'Вопрос',
	entityLabel: 'Вопрос',
	createLabel: 'Новый вопрос',
	sectionLabel: 'Категория',
	storageKey: 'faq-catalog',
	codeFallback: 'faq',
	nameLabel: 'Вопрос',
	detailTextLabel: 'Ответ (Markdown)',
	features: { cover: false, tags: true, preview: false, markdown: true, share: true },
};

export const galleryCatalogConfig: ContentCatalogConfig = {
	blockCode: GALLERY_BLOCK_CODE,
	listAppId: 'galleries',
	detailAppId: 'gallery',
	listTitle: 'Галерея',
	detailTitle: 'Фото',
	entityLabel: 'Фото',
	createLabel: 'Добавить фото',
	sectionLabel: 'Альбом',
	storageKey: 'gallery-catalog',
	codeFallback: 'photo',
	features: { cover: { multiple: true }, tags: false, preview: false, markdown: false, share: true },
	extraFields: [{ type: 'text', prop: CONTENT_PROPS.CAPTION, label: 'Подпись' }],
	detailTextLabel: 'Описание',
};

export const announcementsCatalogConfig: ContentCatalogConfig = {
	blockCode: EVENTS_BLOCK_CODE,
	listAppId: 'announcements',
	detailAppId: 'announcement',
	listTitle: 'События',
	detailTitle: 'Событие',
	entityLabel: 'Событие',
	createLabel: 'Новое событие',
	sectionLabel: 'Раздел',
	storageKey: 'events-catalog',
	codeFallback: 'event',
	extraFields: [
		{ type: 'text', prop: CONTENT_PROPS.EVENT_DATE, label: 'Дата' },
		{ type: 'text', prop: CONTENT_PROPS.PLACE, label: 'Место' },
	],
};

export const contactsCatalogConfig: ContentCatalogConfig = {
	blockCode: CONTACTS_BLOCK_CODE,
	listAppId: 'contacts',
	detailAppId: 'contact',
	listTitle: 'Контакты',
	detailTitle: 'Контакт',
	entityLabel: 'Контакт',
	createLabel: 'Новый контакт',
	sectionLabel: 'Группа',
	storageKey: 'contacts-catalog',
	codeFallback: 'contact',
	features: { cover: { multiple: false }, tags: false, preview: false, markdown: false, share: true },
	extraFields: [
		{ type: 'text', prop: CONTENT_PROPS.POSITION, label: 'Должность' },
		{ type: 'text', prop: CONTENT_PROPS.PHONE, label: 'Телефон' },
		{ type: 'text', prop: CONTENT_PROPS.EMAIL, label: 'Email' },
	],
	detailTextLabel: 'Заметки',
};

export const servicesCatalogConfig: ContentCatalogConfig = {
	blockCode: SERVICES_BLOCK_CODE,
	listAppId: 'services',
	detailAppId: 'service',
	listTitle: 'Услуги',
	detailTitle: 'Услуга',
	entityLabel: 'Услуга',
	createLabel: 'Новая услуга',
	sectionLabel: 'Категория',
	storageKey: 'services-catalog',
	codeFallback: 'service',
	extraFields: [{ type: 'number', prop: CONTENT_PROPS.PRICE, label: 'Цена' }],
};

export const ideasCatalogConfig: ContentCatalogConfig = {
	blockCode: IDEAS_BLOCK_CODE,
	listAppId: 'ideas',
	detailAppId: 'idea',
	listTitle: 'Идеи',
	detailTitle: 'Идея',
	entityLabel: 'Идея',
	createLabel: 'Новая идея',
	sectionLabel: 'Раздел',
	storageKey: 'ideas-catalog',
	codeFallback: 'idea',
	features: { cover: false, tags: true, preview: true, markdown: true, share: true },
	extraFields: [
		{
			type: 'select',
			prop: CONTENT_PROPS.STATUS,
			label: 'Статус',
			options: IDEA_STATUS_OPTIONS,
		},
		{
			type: 'select',
			prop: CONTENT_PROPS.PRIORITY,
			label: 'Приоритет',
			options: IDEA_PRIORITY_OPTIONS,
		},
	],
};

export const leadsCatalogConfig: ContentCatalogConfig = {
	blockCode: LEADS_BLOCK_CODE,
	listAppId: 'leads',
	detailAppId: 'lead',
	listTitle: 'Лиды',
	detailTitle: 'Лид',
	entityLabel: 'Лид',
	createLabel: 'Новый лид',
	sectionLabel: 'Воронка',
	storageKey: 'leads-catalog',
	codeFallback: 'lead',
	features: { cover: false, tags: true, preview: true, markdown: true, share: true },
	extraFields: [
		{
			type: 'select',
			prop: CONTENT_PROPS.STAGE,
			label: 'Стадия',
			options: LEAD_STAGE_OPTIONS,
		},
		{
			type: 'select',
			prop: CONTENT_PROPS.PRIORITY,
			label: 'Приоритет',
			options: LEAD_PRIORITY_OPTIONS,
		},
		{ type: 'text', prop: CONTENT_PROPS.CONTACT, label: 'Контакт' },
	],
};

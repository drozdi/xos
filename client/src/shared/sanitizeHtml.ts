import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img'];

export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS,
		ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt'],
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|data:image\/(?:png|gif|jpeg|webp);base64,)/i,
	});
}

import { ContentCatalogListApp, recipesCatalogConfig } from '@/features/iblock-content';

export default function RecipesApp() {
	return <ContentCatalogListApp config={recipesCatalogConfig} />;
}

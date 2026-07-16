import { createSafeContext } from "../utils/create-safe-context";

export const [DataColumnsProvider, useDataColumnsContext] =
	createSafeContext("XTable component was not found in the tree");

import { Segmented } from 'antd';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useEnumsTypeCategory } from '@inccom/entities/transaction-category';
import { CategotyAdd } from '@inccom/features/category/add';
import { CategoryList } from '@inccom/features/category/list';

export function CategoriesPage() {
	const { id } = useParams();
	const enumsTypeCategory = useEnumsTypeCategory();
	const data = useMemo(
		() => enumsTypeCategory.dataSelect.filter((item) => !item.disabled),
		[enumsTypeCategory.dataSelect],
	);
	const [type, setType] = useState<string>(data[0]?.value as string);

	return (
		<>
			<Segmented
				block
				options={data.map((item) => ({ label: item.label, value: item.value }))}
				value={type}
				onChange={(value) => setType(String(value))}
			/>
			<div style={{ marginTop: 16 }}>
				<CategotyAdd account_id={Number(id)} type={type} />
			</div>
			<div style={{ marginTop: 16 }}>
				<CategoryList account_id={Number(id)} type={type} />
			</div>
		</>
	);
}

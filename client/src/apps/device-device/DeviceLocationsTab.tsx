import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import { normalizeIdRecord } from '@/features/device/deviceAppUtils';

interface DeviceLocationsTabProps {
	locations: unknown;
	readOnly: boolean;
	onChange: (locations: Record<string, Record<string, unknown>>) => void;
}

export function DeviceLocationsTab({ locations, readOnly, onChange }: DeviceLocationsTabProps) {
	const records = normalizeIdRecord(locations);

	return (
		<RecordCollectionEditor
			title="Расположения"
			records={records}
			readOnly={readOnly}
			columns={[
				{ key: 'date', label: 'Дата' },
				{ key: 'place', label: 'Место' },
				{ key: 'responsible', label: 'Ответственный' },
			]}
			onChange={onChange}
			createItem={() => ({ id: 0, date: '', place: '', responsible: '' })}
		/>
	);
}

import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import { normalizeIdRecord } from '@/features/device/deviceAppUtils';
import { formatDeviceDate } from '@/features/device/deviceDateUtils';

interface DeviceLocationsTabProps {
	locations: unknown;
	readOnly: boolean;
	onChange: (locations: Record<string, Record<string, unknown>>) => void;
}

function isSavedLocation(item: Record<string, unknown>): boolean {
	return Number(item.id) > 0;
}

export function DeviceLocationsTab({ locations, readOnly, onChange }: DeviceLocationsTabProps) {
	const records = normalizeIdRecord(locations);

	return (
		<RecordCollectionEditor
			title="Расположения"
			records={records}
			readOnly={readOnly}
			columns={[
				{ key: 'date', label: 'Дата', type: 'date', width: 140 },
				{ key: 'place', label: 'Место' },
				{ key: 'responsible', label: 'Ответственный' },
			]}
			onChange={onChange}
			canRemove={(item) => !isSavedLocation(item)}
			isRowReadOnly={isSavedLocation}
			createItem={() => ({
				id: 0,
				date: formatDeviceDate(new Date()),
				place: '',
				responsible: '',
			})}
		/>
	);
}

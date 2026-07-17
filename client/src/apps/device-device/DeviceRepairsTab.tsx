import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import { normalizeIdRecord } from '@/features/device/deviceAppUtils';

interface DeviceRepairsTabProps {
	repairs: unknown;
	readOnly: boolean;
	onChange: (repairs: Record<string, Record<string, unknown>>) => void;
}

export function DeviceRepairsTab({ repairs, readOnly, onChange }: DeviceRepairsTabProps) {
	const records = normalizeIdRecord(repairs);

	return (
		<RecordCollectionEditor
			title="Ремонты"
			records={records}
			readOnly={readOnly}
			columns={[
				{ key: 'putInto', label: 'Принято' },
				{ key: 'receivedFrom', label: 'Получено' },
				{ key: 'repairman', label: 'Исполнитель' },
				{ key: 'reason', label: 'Причина' },
				{ key: 'description', label: 'Описание', type: 'textarea' },
			]}
			onChange={onChange}
			createItem={() => ({
				id: 0,
				putInto: '',
				receivedFrom: '',
				repairman: '',
				reason: '',
				description: '',
				closed: false,
			})}
		/>
	);
}

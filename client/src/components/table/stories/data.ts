export interface MultiGroupRow {
    region: string;
    category: string;
    status: string;
    name: string;
    amount: number;
}

export const multiGroupData: MultiGroupRow[] = [
    { region: 'Европа', category: 'Электроника', status: 'active', name: 'Телефон A', amount: 120 },
    { region: 'Европа', category: 'Электроника', status: 'active', name: 'Телефон B', amount: 95 },
    { region: 'Европа', category: 'Электроника', status: 'draft', name: 'Планшет X', amount: 210 },
    { region: 'Европа', category: 'Одежда', status: 'active', name: 'Куртка', amount: 80 },
    { region: 'Европа', category: 'Одежда', status: 'active', name: 'Джинсы', amount: 45 },
    { region: 'Европа', category: 'Одежда', status: 'archived', name: 'Шарф', amount: 12 },
    { region: 'Азия', category: 'Электроника', status: 'active', name: 'Ноутбук Pro', amount: 890 },
    { region: 'Азия', category: 'Электроника', status: 'draft', name: 'Ноутбук Lite', amount: 540 },
    { region: 'Азия', category: 'Электроника', status: 'draft', name: 'Монитор', amount: 320 },
    { region: 'Азия', category: 'Мебель', status: 'active', name: 'Стул', amount: 65 },
    { region: 'Азия', category: 'Мебель', status: 'active', name: 'Стол', amount: 150 },
    { region: 'Азия', category: 'Мебель', status: 'archived', name: 'Полка', amount: 30 },
    { region: 'Америка', category: 'Электроника', status: 'active', name: 'Наушники', amount: 75 },
    { region: 'Америка', category: 'Электроника', status: 'active', name: 'Колонка', amount: 110 },
    { region: 'Америка', category: 'Одежда', status: 'draft', name: 'Футболка', amount: 25 },
    { region: 'Америка', category: 'Одежда', status: 'draft', name: 'Кепка', amount: 18 },
    { region: 'Америка', category: 'Мебель', status: 'active', name: 'Диван', amount: 420 },
    { region: 'Америка', category: 'Мебель', status: 'archived', name: 'Тумба', amount: 90 },
];

export const statusBadgeColor: Record<MultiGroupRow['status'], string> = {
    active: 'green',
    draft: 'yellow',
    archived: 'gray',
};

export interface UnifiedRow {
    department: string;
    employee: string;
    role: string;
    salary: number;
}

export const unifiedData: UnifiedRow[] = [
    { department: 'Разработка', employee: 'Иванов А.', role: 'Team Lead', salary: 185000 },
    { department: 'Разработка', employee: 'Петров Б.', role: 'Middle', salary: 145000 },
    { department: 'Разработка', employee: 'Сидоров В.', role: 'Junior', salary: 98000 },
    { department: 'Разработка', employee: 'Козлов Г.', role: 'Senior', salary: 172000 },
    { department: 'Маркетинг', employee: 'Новикова Е.', role: 'Head', salary: 156000 },
    { department: 'Маркетинг', employee: 'Орлова Ж.', role: 'SMM', salary: 92000 },
    { department: 'Маркетинг', employee: 'Волков И.', role: 'Analyst', salary: 118000 },
    { department: 'Продажи', employee: 'Морозов К.', role: 'Head', salary: 164000 },
    { department: 'Продажи', employee: 'Лебедев Л.', role: 'Manager', salary: 112000 },
    { department: 'Продажи', employee: 'Соколов М.', role: 'Manager', salary: 108000 },
];

export interface CombinedNested {
    warehouse?: string;
    zone?: string;
    product: string;
    sku: string;
    qty: number;
}

export interface CombinedRow extends CombinedNested {
    items: CombinedNested[];
}

export const combinedData: CombinedRow[] = [
    {
        warehouse: 'Склад A',
        zone: 'Z-1',
        product: 'Ноутбук Pro',
        sku: 'NB-PRO',
        qty: 12,
        items: [
            { warehouse: 'Склад AA', zone: 'Z-1', product: 'RAM 16GB', sku: 'RAM-16', qty: 12 },
            { warehouse: 'Склад AA', zone: 'Z-1', product: 'SSD 512GB', sku: 'SSD-512', qty: 12 },
        ],
    },
    {
        warehouse: 'Склад A',
        zone: 'Z-1',
        product: 'Монитор 27"',
        sku: 'MON-27',
        qty: 8,
        items: [{ warehouse: 'Склад AA', zone: 'Z-1', product: 'Кабель HDMI', sku: 'HDMI-2', qty: 8 }],
    },
    {
        warehouse: 'Склад A',
        zone: 'Z-2',
        product: 'Клавиатура',
        sku: 'KB-01',
        qty: 24,
        items: [],
    },
    {
        warehouse: 'Склад B',
        zone: 'Z-1',
        product: 'Стул офисный',
        sku: 'CHR-01',
        qty: 15,
        items: [
            { warehouse: 'Склад AA', zone: 'Z-1', product: 'Подлокотники', sku: 'ARM-01', qty: 15 },
            { warehouse: 'Склад AA', zone: 'Z-1', product: 'Крестовина', sku: 'BASE-01', qty: 15 },
        ],
    },
    {
        warehouse: 'Склад B',
        zone: 'Z-2',
        product: 'Стол письменный',
        sku: 'DSK-01',
        qty: 6,
        items: [],
    },
];

export interface ActionDemoRow {
    id: number;
    name: string;
    role: string;
    _actions?: unknown;
}

export const actionDemoData: ActionDemoRow[] = [
    { id: 1, name: 'Анна К.', role: 'Менеджер' },
    { id: 2, name: 'Борис Л.', role: 'Разработчик' },
    { id: 3, name: 'Вера М.', role: 'Аналитик' },
    { id: 4, name: 'Глеб Н.', role: 'Дизайнер' },
];

export interface CellEditRow {
    name: string;
    qty: number;
}

export const cellEditSeed: CellEditRow[] = [
    { name: 'Болт M8', qty: 120 },
    { name: 'Гайка M8', qty: 340 },
    { name: 'Шайба 8', qty: 500 },
    { name: 'Винт M6', qty: 80 },
    { name: 'Гвоздь 50', qty: 200 },
    { name: 'Саморез 4×40', qty: 150 },
    { name: 'Дюбель 6', qty: 90 },
    { name: 'Хомут', qty: 45 },
];

export interface EditElementRow {
    position: number;
    mass: number;
    symbol: string;
    name: string;
    group?: EditElementRow[];
}

export const editElementData: EditElementRow[] = [
    {
        position: 6,
        mass: 12.011,
        symbol: 'C',
        name: 'Carbon',
        group: [
            { position: 8, mass: 15.999, symbol: 'O', name: 'Oxygen' },
            { position: 7, mass: 14.007, symbol: 'N', name: 'Nitrogen' },
        ],
    },
    {
        position: 7,
        mass: 14.007,
        symbol: 'N',
        name: 'Nitrogen',
        group: [
            { position: 6, mass: 12.011, symbol: 'C', name: 'Carbon' },
            { position: 39, mass: 88.906, symbol: 'Y', name: 'Yttrium' },
        ],
    },
    { position: 39, mass: 88.906, symbol: 'Y', name: 'Yttrium' },
    { position: 56, mass: 137.33, symbol: 'Ba', name: 'Barium' },
    { position: 58, mass: 140.12, symbol: 'Ce', name: 'Cerium' },
    { position: 100, mass: 262, symbol: 'Rf', name: 'Rutherfordium' },
];

export interface ElementGroupRow {
    position: number;
    mass: number;
    symbol: string;
    name: string;
    grouped?: string;
    group?: ElementGroupRow[];
}

export const elementGroupRows: ElementGroupRow[] = [
    {
        position: 6,
        mass: 12.011,
        symbol: 'C',
        name: 'Carbon',
        grouped: '1',
        group: [
            { position: 8, mass: 15.999, symbol: 'O', name: 'Oxygen' },
            { position: 7, mass: 14.007, symbol: 'N', name: 'Nitrogen' },
        ],
    },
    {
        position: 7,
        mass: 14.007,
        symbol: 'N',
        name: 'Nitrogen',
        grouped: '2',
        group: [
            { position: 6, mass: 12.011, symbol: 'C', name: 'Carbon' },
            { position: 39, mass: 88.906, symbol: 'Y', name: 'Yttrium' },
        ],
    },
    {
        position: 39,
        mass: 88.906,
        symbol: 'Y',
        name: 'Yttrium',
        grouped: '3',
        group: [
            { position: 56, mass: 137.33, symbol: 'Ba', name: 'Barium' },
            { position: 58, mass: 140.12, symbol: 'Ce', name: 'Cerium' },
        ],
    },
    { position: 56, mass: 137.33, symbol: 'Ba', name: 'Barium', grouped: '1' },
    { position: 58, mass: 140.12, symbol: 'Ce', name: 'Cerium', grouped: '2' },
    { position: 100, mass: 262, symbol: 'Rf', name: 'Rutherfordium', grouped: '3' },
];

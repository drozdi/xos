import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import 'dayjs/locale/en';
import 'dayjs/locale/ru';

dayjs.extend(customParseFormat);

export { dayjs };

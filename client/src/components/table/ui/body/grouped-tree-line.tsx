import type { GroupedTreeLineKind } from '../../utils/group-by';
import classes from '../style.module.css';

export function TableBodyGroupedTreeLine({ kind }: { kind: Exclude<GroupedTreeLineKind, 'none'> }) {
	return <span className={classes['groupedTreeLine']} data-kind={kind} aria-hidden />;
}

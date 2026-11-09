import type { ReactNode } from 'react';
import type { CellValue, ColumnDef as CoreColumnDef } from '../core/types';

/** Column definition for the React layer: header and cell may be any ReactNode. */
export interface ColumnDef<T> extends Omit<CoreColumnDef<T>, 'header' | 'cell'> {
  header: ReactNode;
  cell?: (row: T, value: CellValue) => ReactNode;
}

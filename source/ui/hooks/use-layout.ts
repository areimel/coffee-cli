import {useWindowSize} from 'ink';
import {CUP_WIDTH} from '../../features/cup/cup-art.js';

/**
Heading art needs at least this many columns and rows, else a one-line title.
*/
export const HEADING_ART_MIN_COLUMNS = 64;
export const HEADING_ART_MIN_ROWS = 26;
/**
Cup is hidden below this size.
*/
export const CUP_MIN_COLUMNS = 50;
export const CUP_MIN_ROWS = 18;
/**
Below this width panels stack under the cup; at or above it (with the cup shown) the cup sits left of the panels.
*/
export const FULL_MIN_COLUMNS = 90;
/**
Single status line plus hints below this size.
*/
export const MINIMAL_MAX_COLUMNS = 40;
export const MINIMAL_MAX_ROWS = 10;
/**
Cup column = cup art plus this much gap.
*/
export const CUP_COLUMN_PADDING = 2;

export type LayoutMode = 'full' | 'stacked' | 'minimal';

export type Layout = {
	columns: number;
	rows: number;
	mode: LayoutMode;
	showHeadingArt: boolean;
	showCup: boolean;
	/**
	Width of the cup column in `full` mode, 0 otherwise.
	*/
	cupColumnWidth: number;
	/**
	Width available to the panels.
	*/
	panelWidth: number;
};

export type TerminalSize = {columns: number; rows: number};

/**
Pure breakpoint logic.
*/
export function computeLayout(columns: number, rows: number): Layout {
	const isMinimal = columns < MINIMAL_MAX_COLUMNS || rows < MINIMAL_MAX_ROWS;
	const isShowHeadingArt =
		!isMinimal &&
		columns >= HEADING_ART_MIN_COLUMNS &&
		rows >= HEADING_ART_MIN_ROWS;
	const isShowCup =
		!isMinimal && columns >= CUP_MIN_COLUMNS && rows >= CUP_MIN_ROWS;
	const mode: LayoutMode = isMinimal
		? 'minimal'
		: isShowCup && columns >= FULL_MIN_COLUMNS
			? 'full'
			: 'stacked';
	const cupColumnWidth = mode === 'full' ? CUP_WIDTH + CUP_COLUMN_PADDING : 0;
	return {
		columns,
		rows,
		mode,
		showHeadingArt: isShowHeadingArt,
		showCup: isShowCup,
		cupColumnWidth,
		panelWidth: columns - cupColumnWidth,
	};
}

/**
Current layout; pass `size` to override the terminal size (tests, previews).
*/
export function useLayout(size?: TerminalSize): Layout {
	const windowSize = useWindowSize();
	const {columns, rows} = size ?? windowSize;
	return computeLayout(columns, rows);
}

import {useWindowSize} from 'ink';
import {CREDITS_ROWS} from '../../features/cup/credits.js';
import {
	CUP_FRAME_COLUMNS,
	CUP_FRAME_ROWS,
	HEADING_ART_ROWS,
} from '../../layouts/dashboard-plan.js';

/**
These are upper-bound gates from measured region heights; `layouts/dashboard-plan.ts` then fits the actual content (which varies with battery, notes and options) and may still drop the art or the cup.

Heading art (49 columns, 6 rows + 1 gap) is only considered from this size. Below it: a one-line title. The best case is the full layout, where the cup column is the tallest region: art 7 + framed cup 16 + credits 4 + hints 1 = 28 rows (Session 9 beside Stats 10, plus Options 9, is 19 and fits beside it). Narrower or busier terminals need more; the plan then drops the art.
*/
export const HEADING_ART_MIN_COLUMNS = 64;
export const HEADING_ART_MIN_ROWS =
	HEADING_ART_ROWS + CUP_FRAME_ROWS + CREDITS_ROWS + 1;
/**
The framed cup (steam + cup art in a `Panel`, 16 rows; the credits are dropped first) is hidden below this size: it needs its own rows plus the title and hints.
*/
export const CUP_MIN_COLUMNS = 50;
export const CUP_MIN_ROWS = CUP_FRAME_ROWS + 2;
/**
Below this width panels stack under the cup; at or above it (with the cup shown) the cup sits left of the panels. At 90 columns the panel column is 63 wide, enough for Session beside Stats only when Stats is at most 27 wide (Session needs 36); wider stats stack until about 91 columns.
*/
export const FULL_MIN_COLUMNS = 90;
/**
Single status line plus hints below this size. 12 rows = title 1 + status line 1 + Options panel (up to 9) + hints 1, so above it the options editor always fits whole.
*/
export const MINIMAL_MAX_COLUMNS = 40;
export const MINIMAL_MAX_ROWS = 12;
/**
Cup column = framed cup plus this much gap.
*/
export const CUP_COLUMN_PADDING = 1;

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
	const cupColumnWidth =
		mode === 'full' ? CUP_FRAME_COLUMNS + CUP_COLUMN_PADDING : 0;
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

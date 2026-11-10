import {useWindowSize} from 'ink';
import {CUP_LINES, CUP_WIDTH} from '../../features/cup/cup-art.js';
import {STEAM_HEIGHT} from '../../features/cup/steam.js';

/**
These are upper-bound gates from measured region heights; `layouts/dashboard-plan.ts` then fits the actual content (which varies with battery, notes and options) and may still drop the art or the cup.

Heading art (49 columns, 6 rows + 1 gap) is only considered from this size. Below it: a one-line title. 35 rows = art 7 + Session 10 + Stats 9 (6 lines) + Options 8 + hints 1.
*/
export const HEADING_ART_MIN_COLUMNS = 64;
export const HEADING_ART_MIN_ROWS = 35;
/**
Cup (steam + cup art, 14 rows) is hidden below this size: it needs its own rows plus the title and hints.
*/
export const CUP_MIN_COLUMNS = 50;
export const CUP_MIN_ROWS = STEAM_HEIGHT + CUP_LINES.length + 2;
/**
Below this width panels stack under the cup; at or above it (with the cup shown) the cup sits left of the panels.
*/
export const FULL_MIN_COLUMNS = 90;
/**
Single status line plus hints below this size. 12 rows = title 1 + status line 1 + Options panel (up to 9) + hints 1, so above it the options editor always fits whole.
*/
export const MINIMAL_MAX_COLUMNS = 40;
export const MINIMAL_MAX_ROWS = 12;
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

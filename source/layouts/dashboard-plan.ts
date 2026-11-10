/**
Pure fitting logic for the dashboard: given the terminal size and the measured height of each region, pick the richest arrangement that fits without clipping.

Degradation order (each step only when the previous one still does not fit):
1. Heading art becomes a one-line title.
2. Lower-priority stat lines are dropped.
3. Session and Stats sit side by side instead of stacked.
4. The cup is hidden (then steps 1-3 are retried without it).
5. Session collapses to one status line; stats lines are dropped, then hidden.
The options slot (editor or overlay) is always kept whole.
*/
import {CUP_LINES} from '../features/cup/cup-art.js';
import {STEAM_HEIGHT} from '../features/cup/steam.js';
import {HEADING_HEIGHT} from '../features/heading/heading-art.js';
import type {Layout, LayoutMode} from '../ui/hooks/use-layout.js';

/**
Heading art plus the blank row under it.
*/
export const HEADING_ART_ROWS = HEADING_HEIGHT + 1;
export const TITLE_ROWS = 1;
export const CUP_ROWS = STEAM_HEIGHT + CUP_LINES.length;
/**
Top border line (which carries the title) plus bottom border line of a `Panel`.
*/
export const PANEL_CHROME_ROWS = 2;
/**
Narrowest Session panel used when it shares a row with Stats.
*/
export const SESSION_MIN_WIDTH = 40;
/**
Panels never grow wider than this; the dashboard is centred in wider terminals.
*/
export const PANEL_MAX_WIDTH = 76;

export type SessionForm = 'panel' | 'line';
export type StatsForm = 'stack' | 'beside' | 'hidden';

export type DashboardPlan = {
	mode: LayoutMode;
	showHeadingArt: boolean;
	showCup: boolean;
	session: SessionForm;
	stats: StatsForm;
	/**
	How many stat lines to show (after priority trimming).
	*/
	statsLineCount: number;
	/**
	Width of the panel column.
	*/
	panelWidth: number;
	/**
	Width of the Session panel when `stats` is `beside`.
	*/
	sessionWidth: number;
	/**
	Total rows the plan needs; at most `layout.rows` unless nothing fits.
	*/
	height: number;
};

export type PlanInput = {
	layout: Layout;
	/**
	Rows below the body: key hints plus warning lines.
	*/
	footerRows: number;
	/**
	Height of the Session panel (border included) at a given width.
	*/
	sessionHeight: (width: number) => number;
	stats: {
		count: number;
		/**
		Fewest lines worth showing (the high-priority ones).
		*/
		minCount: number;
		/**
		Natural width of the Stats panel, border included.
		*/
		width: number;
	};
	/**
	Height of whatever fills the options slot (editor or overlay) at a given width.
	*/
	slotHeight: (width: number) => number;
};

type Candidate = {
	isCup: boolean;
	isArt: boolean;
	session: SessionForm;
	stats: StatsForm;
	count: number;
};

function* candidates({layout, stats}: PlanInput): Generator<Candidate> {
	for (const isCup of layout.showCup ? [true, false] : [false]) {
		if (layout.showHeadingArt) {
			yield {
				isCup,
				isArt: true,
				session: 'panel',
				stats: 'stack',
				count: stats.count,
			};
		}

		for (const form of ['stack', 'beside'] as const) {
			for (let {count} = stats; count >= stats.minCount; count--) {
				yield {isCup, isArt: false, session: 'panel', stats: form, count};
			}
		}
	}

	for (let {count} = stats; count >= stats.minCount; count--) {
		yield {isCup: false, isArt: false, session: 'line', stats: 'stack', count};
	}

	yield {
		isCup: false,
		isArt: false,
		session: 'line',
		stats: 'hidden',
		count: 0,
	};
}

function measure(
	input: PlanInput,
	candidate: Candidate,
): DashboardPlan | undefined {
	const {layout, stats} = input;
	const mode: LayoutMode =
		candidate.isCup && layout.mode === 'full' ? 'full' : 'stacked';
	const panelWidth = Math.min(
		PANEL_MAX_WIDTH,
		mode === 'full' ? layout.panelWidth : layout.columns,
	);
	const isBeside = candidate.stats === 'beside';
	const sessionWidth = isBeside ? panelWidth - stats.width : panelWidth;
	if (isBeside && sessionWidth < SESSION_MIN_WIDTH) {
		return undefined;
	}

	const statsRows =
		candidate.stats === 'hidden' ? 0 : PANEL_CHROME_ROWS + candidate.count;
	const sessionRows =
		candidate.session === 'panel' ? input.sessionHeight(sessionWidth) : 1;
	const upper = isBeside
		? Math.max(sessionRows, statsRows)
		: sessionRows + statsRows;
	const panels = upper + input.slotHeight(panelWidth);
	const cupRows = candidate.isCup ? CUP_ROWS : 0;
	const body = mode === 'full' ? Math.max(cupRows, panels) : cupRows + panels;
	const heading = candidate.isArt ? HEADING_ART_ROWS : TITLE_ROWS;
	return {
		mode,
		showHeadingArt: candidate.isArt,
		showCup: candidate.isCup,
		session: candidate.session,
		stats: candidate.stats,
		statsLineCount: candidate.count,
		panelWidth,
		sessionWidth,
		height: heading + body + input.footerRows,
	};
}

/**
The first arrangement, in degradation order, that fits `layout.rows`; the last resort when none does.
*/
export function planDashboard(input: PlanInput): DashboardPlan {
	const {layout} = input;
	if (layout.mode === 'minimal') {
		return {
			mode: 'minimal',
			showHeadingArt: false,
			showCup: false,
			session: 'line',
			stats: 'hidden',
			statsLineCount: 0,
			panelWidth: layout.columns,
			sessionWidth: layout.columns,
			height: 1 + input.footerRows,
		};
	}

	let last: DashboardPlan | undefined;
	for (const candidate of candidates(input)) {
		const plan = measure(input, candidate);
		if (plan === undefined) {
			continue;
		}

		if (plan.height <= layout.rows) {
			return plan;
		}

		last = plan;
	}

	// The final candidate (status line + options) always measures.
	return last!;
}

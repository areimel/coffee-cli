import test from 'ava';
import {CREDITS_ROWS} from '../../source/features/cup/credits.js';
import {
	CUP_FRAME_ROWS,
	HEADING_ART_ROWS,
	SESSION_MIN_WIDTH,
	planDashboard,
	type PlanInput,
} from '../../source/layouts/dashboard-plan.js';
import {
	minStatsCount,
	sessionPanelHeight,
	statsPanelWidth,
	trimStats,
	wrappedRows,
} from '../../source/layouts/region-heights.js';
import {computeLayout} from '../../source/ui/hooks/use-layout.js';
import type {StatLine} from '../../source/features/stats/stats-model.js';
import {makeState, NOW} from '../features/state-fixture.js';

/**
Measured on the real models (default content): Session 9 (36 columns and up), Stats 2 + lines at 33 columns, Options 9.
*/
function input(columns: number, rows: number, footerRows = 1): PlanInput {
	return {
		layout: computeLayout(columns, rows),
		footerRows,
		sessionHeight: width => (width < SESSION_MIN_WIDTH ? 11 : 9),
		stats: {count: 7, minCount: 3, width: 33},
		slotHeight: () => 9,
	};
}

const CUP_REGION = CUP_FRAME_ROWS + CREDITS_ROWS;

test('120x40: art, framed cup with credits, session beside stats', t => {
	const plan = planDashboard(input(120, 40));
	t.like(plan, {
		mode: 'full',
		showHeadingArt: true,
		showCup: true,
		showCredits: true,
		session: 'panel',
		stats: 'beside',
		statsLineCount: 7,
	});
	// The cup column (20) is taller than the beside panels (9 + 9 = 18).
	t.is(plan.height, HEADING_ART_ROWS + CUP_REGION + 1);
	t.is(plan.height, 28);
});

test('full mode: beside needs 36 + Stats (33) columns next to the 27-column cup column', t => {
	t.is(planDashboard(input(96, 40)).stats, 'beside');
	t.like(planDashboard(input(96, 40)), {sessionWidth: 36, panelWidth: 69});
	// One column less and Session would be 35 wide, so the panels stack.
	t.is(planDashboard(input(95, 40)).stats, 'stack');
});

test('90x34: stacked panels (beside does not fit the width), art dropped for height', t => {
	// Panel column is 63; 63 - 33 = 30 < 36. Art stacked needs 7 + 27 + 1 = 35 rows.
	const plan = planDashboard(input(90, 34));
	t.like(plan, {
		mode: 'full',
		showHeadingArt: false,
		showCup: true,
		showCredits: true,
		stats: 'stack',
		statsLineCount: 7,
	});
	t.is(plan.height, 1 + 27 + 1);
	t.true(planDashboard(input(90, 35)).showHeadingArt);
});

test('art goes first, then credits, then the cup stays', t => {
	t.like(planDashboard(input(100, 27)), {
		showHeadingArt: false,
		showCredits: true,
		showCup: true,
		stats: 'beside',
	});
	// Title 1 + cup column 20 + hints 1 = 22 rows with credits.
	t.like(planDashboard(input(100, 22)), {showCredits: true, showCup: true});
	const plan = planDashboard(input(100, 21));
	t.like(plan, {
		showHeadingArt: false,
		showCredits: false,
		showCup: true,
		stats: 'beside',
		statsLineCount: 7,
	});
	t.is(plan.height, 1 + 18 + 1);
});

test('the cup goes before the panels give up anything else', t => {
	const plan = planDashboard(input(100, 19));
	t.like(plan, {showCup: false, showCredits: false, mode: 'stacked'});
	t.true(plan.height <= 19);
});

test('stat lines are trimmed before panels stack', t => {
	// Stacked panels need 9 + 9 + 9 = 27; beside at count 7 needs only 18.
	const plan = planDashboard({
		...input(120, 24),
		stats: {count: 12, minCount: 3, width: 33},
	});
	t.like(plan, {stats: 'beside'});
	t.true(plan.statsLineCount < 12);
	t.true(plan.height <= 24);
});

test('80x24: stacked, cup hidden, session beside stats', t => {
	const plan = planDashboard(input(80, 24));
	t.like(plan, {
		mode: 'stacked',
		showCup: false,
		showCredits: false,
		stats: 'beside',
		statsLineCount: 7,
	});
	t.is(plan.height, 1 + 18 + 1);
});

test('narrow: session collapses to a line, options kept', t => {
	const plan = planDashboard(input(60, 20));
	t.like(plan, {session: 'line', showCup: false, showCredits: false});
	t.true(plan.height <= 20);
});

test('stacked cup only when it fits', t => {
	const plan = planDashboard(input(70, 50));
	t.like(plan, {mode: 'stacked', showCup: true, showCredits: true});
	t.true(plan.height >= CUP_FRAME_ROWS);
});

test('warning rows count against the height', t => {
	t.true(planDashboard(input(120, 29, 1)).showHeadingArt);
	t.false(planDashboard(input(120, 29, 3)).showHeadingArt);
});

test('minimal below the gates', t => {
	const plan = planDashboard(input(38, 20));
	t.like(plan, {mode: 'minimal', showCup: false, showCredits: false});
});

test('credits only ever accompany the cup, and the options slot always fits', t => {
	for (let columns = 40; columns <= 130; columns += 5) {
		for (let rows = 12; rows <= 45; rows++) {
			const plan = planDashboard(input(columns, rows));
			t.true(plan.height <= rows, `${columns}x${rows}`);
			t.true(plan.showCup || !plan.showCredits, `${columns}x${rows}`);
		}
	}
});

test('wrappedRows wraps on words', t => {
	t.is(wrappedRows('hello world', 20), 1);
	t.is(wrappedRows('hello world', 8), 2);
	t.is(wrappedRows('abcdefghij', 4), 3);
	t.is(wrappedRows('', 10), 1);
});

test('sessionPanelHeight counts the default Session rows', t => {
	const state = makeState({
		phase: 'awake',
		locks: {
			system: {status: 'held', method: 'systemd-inhibit'},
			display: {status: 'held', method: 'gnome-session-inhibit'},
		},
	});
	t.is(sessionPanelHeight(state, NOW, 60), 9);
	t.is(
		sessionPanelHeight({...state, notes: ['No battery found']}, NOW, 60),
		10,
	);
});

const lines: StatLine[] = [
	'uptime',
	'session',
	'battery',
	'power',
	'draw',
	'load',
	'host',
].map(id => ({id, label: id, value: 'x'}));

test('trimStats drops by priority and keeps order', t => {
	t.deepEqual(
		trimStats(lines, 5).map(line => line.id),
		['uptime', 'battery', 'power', 'draw', 'load'],
	);
	t.is(minStatsCount(lines), 2);
	t.is(trimStats(lines, 1).length, 2);
});

test('statsPanelWidth counts the bar', t => {
	t.is(
		statsPanelWidth([{id: 'a', label: 'Battery', value: '80%', bar: 0.8}]),
		4 + 7 + 1 + 11 + 3,
	);
});

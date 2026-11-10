import test from 'ava';
import {
	CUP_ROWS,
	HEADING_ART_ROWS,
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
Measured on the real components: Session 10, Stats 3 + lines, Options 9.
*/
function input(columns: number, rows: number, footerRows = 1): PlanInput {
	return {
		layout: computeLayout(columns, rows),
		footerRows,
		sessionHeight: width => (width < 40 ? 12 : 10),
		stats: {count: 7, minCount: 3, width: 33},
		slotHeight: () => 9,
	};
}

test('120x40: everything, stacked panels', t => {
	const plan = planDashboard(input(120, 40));
	t.like(plan, {
		mode: 'full',
		showHeadingArt: true,
		showCup: true,
		session: 'panel',
		stats: 'stack',
		statsLineCount: 7,
	});
	t.is(plan.height, HEADING_ART_ROWS + 10 + 10 + 9 + 1);
});

test('heading art goes first, then stat lines', t => {
	const plan = planDashboard(input(100, 30));
	t.like(plan, {showHeadingArt: false, showCup: true, stats: 'stack'});
	t.is(plan.statsLineCount, 6);
	t.true(plan.height <= 30);
});

test('then session and stats side by side, keeping the cup', t => {
	const plan = planDashboard(input(100, 26));
	t.like(plan, {showCup: true, stats: 'beside', statsLineCount: 7});
});

test('80x24 drops the cup and puts stats beside', t => {
	const plan = planDashboard(input(80, 24));
	t.like(plan, {mode: 'stacked', showCup: false, stats: 'beside'});
	t.true(plan.height <= 24);
});

test('narrow: session collapses to a line, options kept', t => {
	const plan = planDashboard(input(60, 20));
	t.like(plan, {session: 'line', showCup: false});
	t.true(plan.height <= 20);
});

test('stacked cup only when it fits', t => {
	const plan = planDashboard(input(70, 50));
	t.like(plan, {mode: 'stacked', showCup: true});
	t.true(plan.height >= CUP_ROWS);
});

test('warning rows count against the height', t => {
	t.true(planDashboard(input(120, 38, 1)).showHeadingArt);
	t.false(planDashboard(input(120, 38, 3)).showHeadingArt);
});

test('minimal below the gates', t => {
	t.is(planDashboard(input(38, 20)).mode, 'minimal');
});

test('wrappedRows wraps on words', t => {
	t.is(wrappedRows('hello world', 20), 1);
	t.is(wrappedRows('hello world', 8), 2);
	t.is(wrappedRows('abcdefghij', 4), 3);
	t.is(wrappedRows('', 10), 1);
});

test('sessionPanelHeight matches the rendered panel', t => {
	const state = makeState({
		phase: 'awake',
		locks: {
			system: {status: 'held', method: 'systemd-inhibit'},
			display: {status: 'held', method: 'gnome-session-inhibit'},
		},
	});
	t.is(sessionPanelHeight(state, NOW, 60), 10);
	t.is(
		sessionPanelHeight({...state, notes: ['No battery found']}, NOW, 60),
		11,
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

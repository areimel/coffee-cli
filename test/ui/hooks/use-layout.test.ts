import test from 'ava';
import {CUP_WIDTH} from '../../../source/features/cup/cup-art.js';
import {
	computeLayout,
	type Layout,
} from '../../../source/ui/hooks/use-layout.js';

const cupCol = CUP_WIDTH + 2;

const table: Array<[number, number, Omit<Layout, 'columns' | 'rows'>]> = [
	[
		120,
		40,
		{
			mode: 'full',
			showHeadingArt: true,
			showCup: true,
			cupColumnWidth: cupCol,
			panelWidth: 120 - cupCol,
		},
	],
	[
		100,
		24,
		{
			mode: 'full',
			showHeadingArt: false,
			showCup: true,
			cupColumnWidth: cupCol,
			panelWidth: 100 - cupCol,
		},
	],
	[
		80,
		24,
		{
			mode: 'stacked',
			showHeadingArt: false,
			showCup: true,
			cupColumnWidth: 0,
			panelWidth: 80,
		},
	],
	[
		70,
		20,
		{
			mode: 'stacked',
			showHeadingArt: false,
			showCup: true,
			cupColumnWidth: 0,
			panelWidth: 70,
		},
	],
	[
		60,
		30,
		{
			mode: 'stacked',
			showHeadingArt: false,
			showCup: true,
			cupColumnWidth: 0,
			panelWidth: 60,
		},
	],
	[
		45,
		12,
		{
			mode: 'stacked',
			showHeadingArt: false,
			showCup: false,
			cupColumnWidth: 0,
			panelWidth: 45,
		},
	],
	[
		100,
		34,
		{
			mode: 'full',
			showHeadingArt: false,
			showCup: true,
			cupColumnWidth: cupCol,
			panelWidth: 100 - cupCol,
		},
	],
	[
		100,
		35,
		{
			mode: 'full',
			showHeadingArt: true,
			showCup: true,
			cupColumnWidth: cupCol,
			panelWidth: 100 - cupCol,
		},
	],
	[
		80,
		15,
		{
			mode: 'stacked',
			showHeadingArt: false,
			showCup: false,
			cupColumnWidth: 0,
			panelWidth: 80,
		},
	],
	[
		80,
		11,
		{
			mode: 'minimal',
			showHeadingArt: false,
			showCup: false,
			cupColumnWidth: 0,
			panelWidth: 80,
		},
	],
	[
		38,
		20,
		{
			mode: 'minimal',
			showHeadingArt: false,
			showCup: false,
			cupColumnWidth: 0,
			panelWidth: 38,
		},
	],
	[
		100,
		9,
		{
			mode: 'minimal',
			showHeadingArt: false,
			showCup: false,
			cupColumnWidth: 0,
			panelWidth: 100,
		},
	],
];

for (const [columns, rows, expected] of table) {
	test(`computeLayout ${columns}x${rows}`, t => {
		t.deepEqual(computeLayout(columns, rows), {columns, rows, ...expected});
	});
}

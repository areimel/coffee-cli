import {CUP_LINES, CUP_WIDTH, STEAM_ORIGINS} from './cup-art.js';

export const STEAM_HEIGHT = 7;

export type SteamOptions = {
	width?: number;
	height?: number;
	period?: number;
	seed?: number;
	origins?: readonly number[];
};

/**
 Glyphs steam may use, from dense (near the cup) to faint (high up).
 */
export const STEAM_GLYPHS = "(){}~'`.,";

const LIGHT = ['~', "'", '`', ',', '.'] as const;

/**
Small integer hash (Park-Miller steps); deterministic, no Math.random.
*/
function hash(...values: number[]): number {
	let h = 12_345;
	for (const value of values) {
		h = ((h + Math.trunc(value) + 7) * 48_271) % 2_147_483_647;
		h = ((h + 13) * 16_807) % 2_147_483_647;
	}

	return h;
}

function mod(a: number, n: number): number {
	return ((a % n) + n) % n;
}

function pick<T>(items: readonly T[], index: number): T {
	return items[index % items.length]!;
}

type Resolved = Required<SteamOptions>;

function resolve(options: SteamOptions): Resolved {
	return {
		width: options.width ?? CUP_WIDTH,
		height: options.height ?? STEAM_HEIGHT,
		period: options.period ?? 24,
		seed: options.seed ?? 1,
		origins: options.origins ?? STEAM_ORIGINS,
	};
}

/**
Horizontal offset of a wisp at a row (0 is the bottom row) and frame.
A sine travelling upward: the curl seems to drift up the column.
*/
function offsetAt(row: number, frame: number, wisp: number, o: Resolved) {
	const wispPhase = wisp * 2.4;
	const seedPhase = o.seed * 0.7;
	const turn = (2 * Math.PI * frame) / o.period;
	const slant = row * 0.62;
	const wave = Math.sin(slant + turn + wispPhase + seedPhase);
	const amplitude = Math.min(row, 4) * 0.3;
	return wave * (amplitude + 0.9);
}

type Cell = {x: number; glyph: string};

/**
What one wisp draws at one row (0 is the bottom), or undefined for a gap.
*/
function wispCell(
	wisp: number,
	row: number,
	f: number,
	o: Resolved,
): Cell | undefined {
	// Gap pattern drifts upward at `cycle` rows per loop.
	const cycle = o.height * 2;
	const shift = Math.floor((f * cycle) / o.period);
	const origin = o.origins[wisp] ?? 0;
	const h = hash(o.seed, wisp, mod(row - shift, cycle));
	const fade = row / Math.max(1, o.height - 1);
	const isGap = row > 1 && (h % 100) / 100 < fade * fade * 0.5;
	// Outer wisps are shorter than the middle one.
	const isCut = wisp % 2 === 1 && row >= o.height - 1;
	if (isGap || isCut) {
		return undefined;
	}

	const here = offsetAt(row, f, wisp, o);
	const next = offsetAt(row + 1, f, wisp, o);
	const x = origin + Math.round(here);
	if (x < 0 || x >= o.width) {
		return undefined;
	}

	const g = Math.floor(h / 256);
	const isRising = next > here || (next === here && g % 2 === 0);
	let glyph: string;
	if (fade < 0.34) {
		glyph = isRising ? ')' : '(';
		if (g % 4 === 0) {
			glyph = isRising ? '}' : '{';
		}
	} else if (fade < 0.67) {
		glyph = g % 3 === 0 ? '~' : isRising ? ')' : '(';
	} else {
		glyph = pick(LIGHT, g);
	}

	return {x, glyph};
}

/**
One steam frame: `height` lines of exactly `width` characters. Frame
`period` equals frame 0, so the loop is seamless.
*/
export function steamFrame(
	frame: number,
	options: SteamOptions = {},
): string[] {
	const o = resolve(options);
	const f = mod(frame, o.period);
	const grid = Array.from({length: o.height}, () =>
		Array.from({length: o.width}, () => ' '),
	);
	for (const wisp of o.origins.keys()) {
		for (let row = 0; row < o.height; row++) {
			const cell = wispCell(wisp, row, f, o);
			if (cell !== undefined) {
				grid[o.height - 1 - row]![cell.x] = cell.glyph;
			}
		}
	}

	return grid.map(line => line.join(''));
}

/**
 All `period` frames of the looping steam animation.
 */
export function steamFrames(options: SteamOptions = {}): string[][] {
	const {period} = resolve(options);
	return Array.from({length: period}, (_, f) => steamFrame(f, options));
}

/**
 Blank steam for the cold (paused) cup.
 */
export function emptySteam(
	width: number = CUP_WIDTH,
	height: number = STEAM_HEIGHT,
): string[] {
	return Array.from({length: height}, () => ' '.repeat(width));
}

/**
 Steam lines followed by the cup, ready to render line by line.
 */
export function composeCup(
	steamLines: readonly string[],
	cupLines: readonly string[] = CUP_LINES,
): string[] {
	return [...steamLines, ...cupLines];
}

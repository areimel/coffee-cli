import type {SessionState} from '../core/session/types.js';
import type {OptionContext} from '../features/options/option-fields.js';
import type {StatLine} from '../features/stats/stats-model.js';
import {ALL_KEY_BINDINGS} from '../ui/hooks/use-keymap.js';
import type {Layout} from '../ui/hooks/use-layout.js';
import {planDashboard, type DashboardPlan} from './dashboard-plan.js';
import {footerRows, type Overlay} from './Footer.js';
import {
	helpPanelHeight,
	minStatsCount,
	optionsPanelHeight,
	sessionPanelHeight,
	statsPanelWidth,
	themePickerHeight,
} from './region-heights.js';

export type PlanParameters = {
	layout: Layout;
	state: SessionState;
	now: number;
	lines: readonly StatLine[];
	context: OptionContext;
	overlay: Overlay;
	warnings: readonly string[];
};

/**
Measures every region from its model and picks the arrangement that fits. Cheap enough to run on every render.
*/
export function planForState({
	layout,
	state,
	now,
	lines,
	context,
	overlay,
	warnings,
}: PlanParameters): DashboardPlan {
	return planDashboard({
		layout,
		footerRows: footerRows(warnings),
		sessionHeight: width => sessionPanelHeight(state, now, width),
		stats: {
			count: lines.length,
			minCount: minStatsCount(lines),
			width: statsPanelWidth(lines),
		},
		slotHeight(width) {
			if (overlay === 'themes') {
				return themePickerHeight(width);
			}

			return overlay === 'help'
				? helpPanelHeight(ALL_KEY_BINDINGS, width)
				: optionsPanelHeight(state.options, context, width);
		},
	});
}

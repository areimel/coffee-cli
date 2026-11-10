import type {ReactNode} from 'react';
import {Box} from 'ink';
import type {Layout} from '../ui/hooks/use-layout.js';
import type {DashboardPlan} from './dashboard-plan.js';

export type DashboardLayoutProps = {
	readonly layout: Layout;
	/**
	What fits, from `planDashboard`.
	*/
	readonly plan: DashboardPlan;
	/**
	Heading (art or one-line title, matching `plan.showHeadingArt`).
	*/
	readonly heading: ReactNode;
	readonly cup: ReactNode;
	/**
	The Session panel.
	*/
	readonly session: ReactNode;
	/**
	The one-row session summary used when the panel does not fit.
	*/
	readonly statusLine: ReactNode;
	readonly stats: ReactNode;
	/**
	The options editor panel.
	*/
	readonly options: ReactNode;
	/**
	Theme picker or help; takes the options slot while open.
	*/
	readonly overlay?: ReactNode;
	/**
	Key hints and warnings, pinned to the bottom row(s).
	*/
	readonly footer: ReactNode;
	/**
	Theme background painted over the whole screen.
	*/
	readonly backgroundColor?: string;
};

function Panels({
	plan,
	session,
	statusLine,
	stats,
	slot,
}: Pick<DashboardLayoutProps, 'plan' | 'session' | 'statusLine' | 'stats'> & {
	readonly slot: ReactNode;
}) {
	const sessionNode = plan.session === 'panel' ? session : statusLine;
	return (
		<Box flexDirection="column" width={plan.panelWidth} flexShrink={0}>
			{plan.stats === 'beside' ? (
				<Box>
					<Box flexDirection="column" width={plan.sessionWidth}>
						{sessionNode}
					</Box>
					<Box flexDirection="column" flexGrow={1}>
						{stats}
					</Box>
				</Box>
			) : (
				<>
					{sessionNode}
					{plan.stats === 'stack' ? stats : null}
				</>
			)}
			{slot}
		</Box>
	);
}

/**
Arranges the regions; decides nothing itself. `full`: heading, then cup column left of the stacked panels. `stacked`: one column, cup (if shown) above the panels. `minimal`: status line (or the open overlay). Key hints always sit on the bottom row, and the root is exactly the terminal size so the alternate screen never scrolls.
*/
export function DashboardLayout({
	layout,
	plan,
	heading,
	cup,
	session,
	statusLine,
	stats,
	options,
	overlay,
	footer,
	backgroundColor,
}: DashboardLayoutProps) {
	const slot = overlay ?? options;
	const panels = (
		<Panels
			plan={plan}
			session={session}
			statusLine={statusLine}
			stats={stats}
			slot={slot}
		/>
	);
	let body: ReactNode;
	if (plan.mode === 'minimal') {
		body = <Box width={layout.columns}>{overlay ?? statusLine}</Box>;
	} else if (plan.mode === 'full') {
		body = (
			<Box>
				<Box
					flexDirection="column"
					flexShrink={0}
					width={layout.cupColumnWidth}
					paddingRight={1}
				>
					{cup}
				</Box>
				{panels}
			</Box>
		);
	} else {
		body = (
			<Box flexDirection="column">
				{plan.showCup ? (
					<Box flexShrink={0} justifyContent="center">
						{cup}
					</Box>
				) : null}
				{panels}
			</Box>
		);
	}

	return (
		<Box
			flexDirection="column"
			alignItems="center"
			width={layout.columns}
			height={layout.rows}
			overflow="hidden"
			{...(backgroundColor === undefined ? {} : {backgroundColor})}
		>
			{plan.mode === 'minimal' ? null : (
				<Box flexShrink={0} marginBottom={plan.showHeadingArt ? 1 : 0}>
					{heading}
				</Box>
			)}
			<Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
				{body}
			</Box>
			<Box flexDirection="column" flexShrink={0}>
				{footer}
			</Box>
		</Box>
	);
}

/**
The one-line exit summary and exit code, shared by the dashboard and plain mode.
*/
import {formatElapsed} from './core/format.js';
import {describeStopReason} from './core/session/selectors.js';
import type {SessionState} from './core/session/types.js';

export const PREFIX = 'coffee-cli:';

export type ExitOutcome = {
	/**
	The line printed to stdout once the dashboard is gone.
	*/
	summary: string;
	code: number;
};

/**
How long the session ran (start to stop, or to `now` when it has not stopped), in ms.
*/
export function awakeMs(state: SessionState, now?: number): number {
	if (state.startedAt === undefined) {
		return 0;
	}

	const end = state.stoppedAt ?? now ?? state.startedAt;
	return Math.max(0, end - state.startedAt);
}

/**
Summary and exit code for a terminal state: `lock-failed` and `unsupported` exit 1, everything else 0. `now` is only used when the state has no `stoppedAt`.
*/
export function summarize(state: SessionState, now?: number): ExitOutcome {
	if (state.phase === 'unsupported') {
		return {
			summary: `${PREFIX} ${state.message ?? 'This platform is not supported'}`,
			code: 1,
		};
	}

	const reason = state.stopReason ?? 'user';
	const why =
		reason === 'lock-failed' && state.message !== undefined
			? `${describeStopReason(reason)}: ${state.message}`
			: describeStopReason(reason);
	return {
		summary: `${PREFIX} stayed awake for ${formatElapsed(awakeMs(state, now))} — ${why}`,
		code: reason === 'lock-failed' ? 1 : 0,
	};
}

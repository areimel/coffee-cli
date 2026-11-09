import {Box} from 'ink';
import {T} from '../../ui/kit/index.js';
import {HEADING_LINES} from './heading-art.js';

export type HeadingProps = {
	/**
	One bold line instead of the ANSI Shadow art.
	*/
	readonly isCompact: boolean;
};

/**
The `COFFEE` heading: ANSI Shadow art, or a single line when space is tight.
*/
export function Heading({isCompact}: HeadingProps) {
	if (isCompact) {
		return (
			<Box>
				<T bold tone="accent">
					COFFEE
				</T>
				<T tone="muted"> keeps your machine awake</T>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			{HEADING_LINES.map(line => (
				<T key={line} tone="accent" wrap="truncate-end">
					{line}
				</T>
			))}
		</Box>
	);
}

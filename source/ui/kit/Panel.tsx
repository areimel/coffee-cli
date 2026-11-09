import type {ReactNode} from 'react';
import {Box} from 'ink';
import {useTheme} from '../../theme/context.js';
import {FOCUS_MARKER} from './glyphs.js';
import {optionalProp} from './optional-prop.js';
import {T, toneProps} from './T.js';

/**
The one border style used by every panel in the app.
*/
export const PANEL_BORDER_STYLE = 'round';

export type PanelProps = {
	/**
	Title row. When focused it is bold, accent-toned and prefixed with the focus marker.
	*/
	readonly title?: string;
	/**
	Focused panels get the `accent` border; others the `border` tone.
	*/
	readonly isFocused?: boolean;
	readonly width?: number | string;
	readonly height?: number | string;
	readonly flexGrow?: number;
	/**
	Horizontal padding inside the border. Default 1.
	*/
	readonly paddingX?: number;
	readonly children?: ReactNode;
};

/**
Titled bordered box.
*/
export function Panel({
	title,
	isFocused = false,
	width,
	height,
	flexGrow,
	paddingX = 1,
	children,
}: PanelProps) {
	const theme = useTheme();
	const {color} = toneProps(theme, isFocused ? 'accent' : 'border');
	return (
		<Box
			flexDirection="column"
			borderStyle={PANEL_BORDER_STYLE}
			paddingX={paddingX}
			{...optionalProp('borderColor', color)}
			{...optionalProp('width', width)}
			{...optionalProp('height', height)}
			{...optionalProp('flexGrow', flexGrow)}
		>
			{title === undefined ? null : (
				<T bold={isFocused} tone={isFocused ? 'accent' : 'text'}>
					{isFocused ? `${FOCUS_MARKER} ${title}` : title}
				</T>
			)}
			{children}
		</Box>
	);
}

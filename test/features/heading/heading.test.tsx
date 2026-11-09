import test from 'ava';
import {Heading} from '../../../source/features/heading/Heading.js';
import {HEADING_LINES} from '../../../source/features/heading/heading-art.js';
import {renderThemed} from '../../helpers/render-themed.js';

test('full heading renders the six art lines', t => {
	const r = renderThemed(<Heading isCompact={false} />);
	const frame = r.plainFrame();
	t.true(frame.includes(HEADING_LINES[0]!.trimEnd()));
	t.is(frame.split('\n').length, 6);
	r.unmount();
});

test('compact heading is one line with a tagline', t => {
	const r = renderThemed(<Heading isCompact />);
	const frame = r.plainFrame();
	t.is(frame.split('\n').length, 1);
	t.true(frame.includes('COFFEE'));
	t.true(frame.includes('keeps your machine awake'));
	r.unmount();
});

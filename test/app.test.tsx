import {stripVTControlCharacters} from 'node:util';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from '../source/app.js';

const frame = (output: string | undefined) =>
	stripVTControlCharacters(output ?? '');

test('greet unknown user', t => {
	const {lastFrame} = render(<App name={undefined} />);

	t.is(frame(lastFrame()), 'Hello, Stranger');
});

test('greet user with a name', t => {
	const {lastFrame} = render(<App name="Jane" />);

	t.is(frame(lastFrame()), 'Hello, Jane');
});

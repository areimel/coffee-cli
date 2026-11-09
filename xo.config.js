import xoReact from 'eslint-config-xo-react';

const xoConfig = [
	{ignores: ['dist', 'package.json', '**/*.md']},
	...xoReact({prettier: true}),
	{
		prettier: true,
		space: false,
		rules: {
			// PascalCase component files (.tsx) and kebab-case modules (.ts) coexist.
			'unicorn/filename-case': [
				'error',
				{cases: {kebabCase: true, pascalCase: true}},
			],
		},
	},
];

export default xoConfig;

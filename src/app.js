import React, { useEffect } from 'react';
import { Box, Text } from 'ink';

export default function App({ task }) {
	const [state, dispatch] = React.useReducer((state, action) => {
		switch (action.type) {
			case 'init':
				return { ...state, ...action.payload };
			default:
				return state;
		}
	}, {
		name: 'unknown',
		info: '-',
		max_concurrent: 0,
		max_cache_results: 0,
		max_cache_errors: 0,
		check_interval: 0,
	});

	const t = task.t;

	t.on('init.end', (data) => {
		dispatch({ type: 'init', payload: data });
	});

	useEffect(() => {

	}, [t]);
	return (
		<Box height={10} flexDirection="column">
			<Box height={5}>
				<Text>
					Task: <Text color="green">{state.name}</Text>
				</Text>

				<Text>
					{'    '}
					<Text color="gray">{state.info}</Text>
				</Text>
			</Box>
			<Box height={5}  flexDirection="column">
				{Object.keys(task).map((key) => (
					<Text key={key}>
						{key}: <Text color="gray">{task[key] + ''}</Text>
					</Text>
				))}
			</Box>
		</Box>

	);
}

import React from 'react';
import { Box, Text } from 'ink';

export default function App({ name = 'Stranger', task = {} }) {
	const title = task.title || 'no title';
	return (
		<Box height={10} flexDirection="column">
			<Box height={1}>
				<Text>
					Hello, <Text color="green">{name}</Text>
				</Text>
			</Box>
			<Box height={5}>
				<Text>
					Task: <Text color="green">{title}</Text>
				</Text>
			</Box>
		</Box>

	);
}

import React from 'react';
import { Box, Text } from 'ink';

export default function App({ name = 'Stranger' }) {
	return (
		<Box height={10}>
			<Text>
				Hello, <Text color="green">{name}</Text>
			</Text>
		</Box>

	);
}

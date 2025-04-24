import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import Baka from './baka.js';

/**
 * 
 * @param {{baka:Baka}} props 
 * @returns 
 */
export default function App({ baka }) {
  const [state, setState] = React.useReducer((prev, next) => ({ ...prev, ...next }), {
    // TODO: add more state variables as needed
    config: baka.config,
    stats: {
      total: 0,
      alive: 0,
      ok: 0,
      fail: 0,
      err: 0,
    },
    alives: [],
    results: [],
    errors: [],
  });

  useEffect(() => {
    baka.on('initialized', () => {
      setState({ config: baka.config });
    });
    baka.on('pickup', (task) => {
      setState({
        stats: {
          ...baka.stats,
          alive: baka.sheet.alives.size,
        },
      });
    });
    baka.on('popup', (task) => {

    });
    baka.on('progress', (task) => {
      // TODO: handle progress event
    });
  }, [baka]);
  return (
    <Box height="auto" flexDirection="column">
      <Text>
        Task: <Text color="green">{state.config.name}</Text>
        {'    '}
        <Text color="gray">{state.config.description}</Text>
      </Text>
      <StatsView {...state.stats} />
    </Box>

  );
}

function StatsView({ total, alive, ok, fail, err }) {
  return (
    <Box flexDirection="column">
      <Text>Total: {total}</Text>
      <Text>Alive: {alive}</Text>
      <Text>OK: {ok}</Text>
      <Text>Fail: {fail}</Text>
      <Text>Err: {err}</Text>
    </Box>
  );
}


function mySlice(arr, n) {
  const a = [...arr];
  if (a.length <= n) {
    return [a, [], 0];
  }
  const l = Math.floor(--n / 2);
  const r = -(l + n % 2);
  return [a.slice(0, l), a.slice(r), a.length - n];
}
import React, { useReducer, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import Baka from './baka.js';
import Denque from 'denque';
import BaseTask from './tasks/base.js';

/**
 * 
 * @param {{baka:Baka}} props 
 * @returns 
 */
export default function App({ baka }) {
  const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
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
    echoBuffer: [],
  });

  const echoQueue = useRef(new Denque([], { capacity: 5 }));

  useEffect(() => {
    baka.on('init', () => {
      setState({ config: baka.config });
    });
    baka.on('pickup', (/** @type {BaseTask} */ task) => {
      setState({
        stats: { ...baka.stats },
      });
      baka.emit('echo', `Task ${task.title} started. ${echoQueue.current.size()}`);
    });
    baka.on('popup', (/** @type {BaseTask} */ task) => {
      baka.emit('echo', `Task ${task.title} finished.`);

    });
    baka.on('progress', (/** @type {BaseTask} */ task) => {
      // TODO: handle progress event
    });

    baka.on('echo', (/** @type {String} */ msg) => {
      echoQueue.current.push(`[${formatTime()}] ${msg}`);
      setState({
        echoBuffer: echoQueue.current.toArray()
      });
    })
  }, [baka]);
  return (
    <Box height="auto" flexDirection="column">
      {Object.keys(state.config).map((key) =>
        <Text key={key}>
          <Text color="blue"> {key}:</Text>
          <Text color="yellow"> {state.config[key]}</Text>
        </Text>
      )}
      <Text color="gray">----------------------------------</Text>
      <EchoView texts={state.echoBuffer} />
      <Text color="gray">----------------------------------</Text>
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


function EchoView({ texts }) {
  return (
    <Box flexDirection="column">
      {texts.map((text, index) => (
        <Text key={index} color="gray">{text}</Text>
      ))}
    </Box>
  );
}


/**
 * @description 自定义数组切片函数，返回一个包含左侧、右侧和剩余长度的数组
 * @param {Array} arr - 输入数组
 * @param {number} n - 切片长度
 * @returns {[Array, Array, number]} - 左侧数组、右侧数组和剩余长度
 */
function mySlice(arr, n) {
  const a = [...arr];
  if (a.length <= n) {
    return [a, [], 0];
  }
  const l = Math.floor(--n / 2);
  const r = -(l + n % 2);
  return [a.slice(0, l), a.slice(r), a.length - n];
}



const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false // 使用 24 小时制
});

function formatTime(date = null) {
  date = date || new Date();
  return timeFormatter.format(date);
}
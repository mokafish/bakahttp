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
  const [state, setState] = useReducer((prev, next) => ({ ...prev, ...(typeof next == 'function' ? next() : next) }), {
    // TODO: add more state variables as needed
    config: baka.config,
    stats: {
      total: 0,
      alive: 0,
      ok: 0,
      fail: 0,
      err: 0,
    },
    alives: [[], [], 0],
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
        alives: mySlice(baka.sheet.alives, 5),
      });
      baka.emit('echo', `Task ${task.title} started. ${echoQueue.current.size()}`);
    });
    baka.on('popup', (/** @type {BaseTask} */ task) => {
      setState({
        stats: { ...baka.stats },
        alives: mySlice(baka.sheet.alives, 5),
        results: getQueTail(baka.sheet.results, 10),
        errors: getQueTail(baka.sheet.errors, 5),
      });
      baka.emit('echo', `Task ${task.title} finished. ${baka.sheet.results.length} cache.`);

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
      <Text>
        {state.config.name} -{state.config.maxConcurrent}{' '}
        {state.config.delay}+{state.config.delayPlus}ms{' '}
        {state.config.pickupCount}+{state.config.pickupCountPlus}u
      </Text>
      <EchoView texts={state.echoBuffer} />
      {/* ---------------- */}

      <Box height={5} flexDirection="column" >
        {state.alives[0].map((v, i) => <Text key={i}>
          <Text color="magentaBright">* {v.title}</Text>
        </Text>)}
        {state.alives[2] != 0 && <Text>
          <Text color="magenta">...{state.alives[2]} items hidden</Text>
        </Text>}
        {state.alives[1].map((v, i) => <Text key={i}>
          <Text color="magentaBright">* {v.title}</Text>
        </Text>)}

      </Box>
      {/* ---------------- */}
      {/* <Box flexDirection="column" height={5}>
        {state.errors.map((item, index) => (
          <Text key={index} color="whiteBright">
            <Text color="red">o </Text>
            {item?.title}
          </Text>
        ))}
      </Box> */}

      {/* ---------------- */}
      <Box flexDirection="column" height={10}>

        {state.results.map((item, index) => (
          <Text key={index} color="blueBright">
            <Text color="blue">o </Text>
            {item?.title}
          </Text>
        ))}
      </Box>
      {/* ---------------- */}
      <StatsView {...state.stats} />
    </Box>

  );
}

// function listView({ items, color = 'white' }) {
//   return (
//     <Box flexDirection="column">
//       {items.map((item, index) => (
//         <Text key={index} color={color}>{item}</Text>
//       ))}
//     </Box>
//   );
// }


function StatsView({ total, alive, ok, fail, err }) {
  return (
    <Box flexDirection="column">
      <Text>
        Total: {total}{'  '}
        Alive: {alive}{'  '}
        OK: {ok}{'  '}
        Fail: {fail}{'  '}
        Err: {err}{' '}
      </Text>
    </Box>
  );
}


function EchoView({ texts }) {
  return (
    <Box flexDirection="column" height={5}>
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

/**
 * 
 * @param {Denque} q 
 * @param {Number} n 
 * @returns {Array} - 返回一个包含最后 n 个元素的数组
 */
function getQueTail(q, n) {

  n = Math.min(q.length, n);
  let a = new Array(n);
  for (let i = 0; i < n; i++) {
    a[i] = q.peekAt(q.length - n + i);
  }
  return a
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
import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import Baka from './baka.js';

/**
 * 
 * @param {{baka:Baka}} props 
 * @returns 
 */
export default function App({
  baka
}) {
  const [state, setState] = React.useReducer((prev, next) => ({
    ...prev,
    ...next
  }), {
    // TODO: add more state variables as needed
    config: baka.config,
    stats: {
      total: 0,
      alive: 0,
      ok: 0,
      fail: 0,
      err: 0
    },
    alives: [],
    results: [],
    errors: []
  });
  useEffect(() => {
    baka.on('init', () => {
      setState({
        config: baka.config
      });
    });
    baka.on('pickup', task => {
      setState({
        stats: {
          ...baka.stats,
          alive: baka.sheet.alives.size
        }
      });
    });
    baka.on('popup', task => {});
    baka.on('progress', task => {
      // TODO: handle progress event
    });
  }, [baka]);
  return /*#__PURE__*/React.createElement(Box, {
    height: "auto",
    flexDirection: "column"
  }, Object.keys(state.config).map(key => /*#__PURE__*/React.createElement(Text, {
    key: key
  }, /*#__PURE__*/React.createElement(Text, {
    color: "blue"
  }, " ", key, ":"), /*#__PURE__*/React.createElement(Text, {
    color: "yellow"
  }, " ", state.config[key]))), /*#__PURE__*/React.createElement(StatsView, state.stats));
}
function StatsView({
  total,
  alive,
  ok,
  fail,
  err
}) {
  return /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Text, null, "Total: ", total), /*#__PURE__*/React.createElement(Text, null, "Alive: ", alive), /*#__PURE__*/React.createElement(Text, null, "OK: ", ok), /*#__PURE__*/React.createElement(Text, null, "Fail: ", fail), /*#__PURE__*/React.createElement(Text, null, "Err: ", err));
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
import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { ManagerModel } from './models.js';

/**
 * 
 * @param {{baka:ManagerModel}} props 
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
    config: baka.config
  });
  useEffect(() => {
    // TODO: add event listeners to update state
  }, [baka]);
  return /*#__PURE__*/React.createElement(Box, {
    height: "auto",
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Text, null, "Task: ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, state.config.name), '    ', /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, state.config.description)));
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
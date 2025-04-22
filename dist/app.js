import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
export default function App({
  task
}) {
  const [state, dispatch] = React.useReducer((state, action) => {
    switch (action.type) {
      case 'init':
        return {
          ...state,
          ...action.payload
        };
      default:
        return state;
    }
  }, {
    name: 'unknown',
    info: '-',
    max_concurrent: 0,
    max_cache_results: 0,
    max_cache_errors: 0,
    check_interval: 0
  });
  const t = task.t;
  t.on('init.end', data => {
    dispatch({
      type: 'init',
      payload: data
    });
  });
  useEffect(() => {}, [t]);
  return /*#__PURE__*/React.createElement(Box, {
    height: 10,
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Box, {
    height: 5
  }, /*#__PURE__*/React.createElement(Text, null, "Task: ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, state.name)), /*#__PURE__*/React.createElement(Text, null, '    ', /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, state.info))), /*#__PURE__*/React.createElement(Box, {
    height: 5,
    flexDirection: "column"
  }, Object.keys(task).map(key => /*#__PURE__*/React.createElement(Text, {
    key: key
  }, key, ": ", /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, task[key] + '')))));
}
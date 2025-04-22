import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
export default function App({
  task,
  o
}) {
  const [state, dispatch] = React.useReducer((state, action) => {
    switch (action.type) {
      case 'init':
        return {
          ...state,
          ...action.payload
        };
      case 'echo':
        let b = state.echo_buffer;
        if (b.length > 5) {
          b = b.slice(1);
        }
        return {
          ...state,
          echo_buffer: [...b, action.payload]
        };
      case 'submit':
        return {
          ...state,
          running_list: mySlice(o.running_set, 10)
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
    check_interval: 0,
    echo_buffer: [],
    running_list: [[], [], 0]
  });
  const t = task.t;
  useEffect(() => {
    dispatch({
      type: 'init',
      payload: t
    });
    t.on('init.end', data => {
      dispatch({
        type: 'init',
        payload: data
      });
    });
    t.on('echo', (...data) => {
      dispatch({
        type: 'echo',
        payload: data.join(' ')
      });
    });
    t.on('run', data => {
      t.emit('echo', `run ${data.title}`);
    });
    t.on('run.end', data => {
      t.emit('echo', `done ${data.title}`);
    });
    t.on('submit', data => {
      dispatch({
        type: 'submit',
        payload: data
      });
    });
  }, [t]);
  return /*#__PURE__*/React.createElement(Box, {
    height: "auto",
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Text, null, "Task: ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, state.name), '    ', /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, state.info)), /*#__PURE__*/React.createElement(Box, {
    height: 10,
    flexDirection: "column"
  }, state.running_list[0].map((v, i) => /*#__PURE__*/React.createElement(Text, {
    key: i
  }, /*#__PURE__*/React.createElement(Text, {
    color: "blue"
  }, v.title))), state.running_list[2] != 0 && /*#__PURE__*/React.createElement(Text, null, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, "...", state.running_list[2], " items hidden")), state.running_list[1].map((v, i) => /*#__PURE__*/React.createElement(Text, {
    key: i
  }, /*#__PURE__*/React.createElement(Text, {
    color: "blue"
  }, v.title)))), /*#__PURE__*/React.createElement(Box, {
    height: 5,
    flexDirection: "column"
  }, state.echo_buffer.map((v, i) => /*#__PURE__*/React.createElement(Text, {
    key: i
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, v)))));
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
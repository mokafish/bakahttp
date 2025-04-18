import React from 'react';
import { Box, Text } from 'ink';
export default function App({
  name = 'Stranger',
  task = {}
}) {
  const title = task.title || 'no title';
  return /*#__PURE__*/React.createElement(Box, {
    height: 10,
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Box, {
    height: 1
  }, /*#__PURE__*/React.createElement(Text, null, "Hello, ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, name))), /*#__PURE__*/React.createElement(Box, {
    height: 5
  }, /*#__PURE__*/React.createElement(Text, null, "Task: ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, title))));
}
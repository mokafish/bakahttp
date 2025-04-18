import React from 'react';
import { Box, Text } from 'ink';
export default function App({
  name = 'Stranger'
}) {
  return /*#__PURE__*/React.createElement(Box, {
    height: 10
  }, /*#__PURE__*/React.createElement(Text, null, "Hello, ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, name)));
}
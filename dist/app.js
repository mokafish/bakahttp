import React from 'react';
import { Text } from 'ink';
export default function App({
  name = 'Stranger'
}) {
  return /*#__PURE__*/React.createElement(Text, null, "Hello, ", /*#__PURE__*/React.createElement(Text, {
    color: "green"
  }, name));
}
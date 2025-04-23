// view/components/TaskView.jsx
import React, { useEffect } from 'react';
import { Box, Text } from 'ink';

export default function TaskView({ taskModel }) {
  const [state, setState] = React.useReducer((prev, next) => ({ ...prev, ...next }), {
    config: {},
    runningList: [],
    echoBuffer: []
  });

  useEffect(() => {
    const updateRunning = () => {
      const running = [...taskModel.runningSet];
      setState({ runningList: running });
    };

    taskModel
      .on('runStart', data => {
        setState({ 
          echoBuffer: [...state.echoBuffer.slice(-4), `Started: ${data.title}`]
        });
        updateRunning();
      })
      .on('runEnd', updateRunning)
      .on('runSuccess', data => {
        setState({
          echoBuffer: [...state.echoBuffer.slice(-4), `Completed: ${data.title}`]
        });
      });

    // 初始化配置
    setState({
      config: taskModel.config,
      name: taskModel.config.name,
      info: taskModel.config.info
    });

    return () => taskModel.removeAllListeners();
  }, [taskModel]);

  return (
    <Box flexDirection="column">
      <Header {...state.config} />
      <RunningList items={state.runningList} />
      <StatusLogs logs={state.echoBuffer} />
    </Box>
  );
}

// 子组件拆分
const Header = ({ name, info }) => (
  <Box>
    <Text color="green">{name}</Text>
    <Text color="gray"> - {info}</Text>
  </Box>
);

const RunningList = ({ items }) => (
  <Box flexDirection="column">
    {items.map((item, i) => (
      <Text key={i} color="blue">{item.title}</Text>
    ))}
  </Box>
);

const StatusLogs = ({ logs }) => (
  <Box flexDirection="column">
    {logs.map((log, i) => (
      <Text key={i} color="gray">{log}</Text>
    ))}
  </Box>
);
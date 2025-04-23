# supports-color-cli

> Detect whether a terminal supports color

## Install

```
$ npm install --global supports-color-cli
```

## Usage

```
$ supports-color --help

  Usage
    $ supports-color

  Options
    --256  Check for 256 color support
    --16m  Check for 16 million color support

  Examples
    $ supports-color
    $ supports-color --256
    $ supports-color --16m

  Exits with code 0 if color is supported and 1 if not
```

## Related

- [supports-color](https://github.com/chalk/supports-color) - API for this module

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Josh Junon](https://github.com/qix-)



## 设计
一个nodejs微任务管理器，用于管理长期循环执行的任务，被动接取模式，支持并发控制和丰富的可视化。
- 主要作为cli程序设计
- 任务脚本由用户定义
- 动态加载任务脚本, 依次尝试加载以下文件
  1. 当前目录 `import('./${name}.js')`
  2. 当前的tasks目录  `import('./tasks/${name}.js')`
  3. 项目内置任务  `import(import.meta.resolve('../tasks/${name}.js'))`
- 界面
  - 显示最近10条结果
  - 显示10条运行中的任务，如有多，显示最早4条，中间隐藏的条数，最近5条
  - 显示最近5条的echo事件消息，
  - 显示状态统计信息

## 架构
- 使用MVC结构方便维护
- 使用react+ink+meow构建cli界面
- 使用denque 队列缓存结果和各种数据流， 方便用于显示和自动检查


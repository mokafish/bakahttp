import fs from 'fs/promises';
import os from 'os';
export async function perfStats() {
  let cpu = os.loadavg()[0];
  let totalmem = os.totalmem();
  let freemem = os.freemem();
  let mem = (totalmem - freemem) / totalmem * 100;
  let net = await getNetworkStats();
  let net_rx = net.rx;
  let net_tx = net.tx;
  let net_sp = net.speed_mix;
  return {
    cpu,
    mem,
    net_rx,
    net_tx,
    net_sp
  };
}
let g_last_rx = 0;
let g_last_tx = 0;
let g_init_rx = 0;
let g_init_tx = 0;
async function getNetworkStats(last_rx, last_tx) {
  if (last_rx === undefined || last_tx === undefined) {
    last_rx = g_last_rx;
    last_tx = g_last_tx;
  }
  let res = {
    // all iface sum results
    rx: 0,
    tx: 0,
    speed_mix: 0,
    speed_rx: 0,
    speed_tx: 0
  };
  try {
    const content = await fs.readFile('/proc/net/dev', 'utf8');
    const lines = content.split('\n').slice(2); // 跳过前两行
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue; // 跳过不完整的行
      const iface = parts[0].replace(':', '');
      if (iface === 'lo') continue; // 跳过回环接口
      const rx = parseInt(parts[1]) - g_init_rx;
      const tx = parseInt(parts[9]) - g_init_tx;
      res.rx += rx;
      res.tx += tx;
    }
    g_last_rx = res.rx;
    g_last_tx = res.tx;
    if (g_init_rx === 0 && g_init_tx === 0) {
      g_init_tx = res.tx;
      g_init_rx = res.rx;
    }
    res.speed_rx = res.rx - last_rx;
    res.speed_tx = res.tx - last_tx;
    res.speed_mix = res.speed_rx + res.speed_tx;
  } catch (err) {
    // skip
  }
  return res;
}
export function readableBytes(bytes = 0, units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']) {
  let i = 0;
  while (i < units.length - 1 && bytes >= 1024) {
    bytes /= 1024;
    i++;
  }
  let n = adaptiveToFixed(bytes);
  return `${n}${units[i]}`;
}
export function adaptiveToFixed(n) {
  if (n > 100) return n.toFixed(0);
  if (n > 10) return n.toFixed(1);
  return n.toFixed(2);
}

/**
 * @beta
 */
class LoadAvgSimulator {
  constructor() {
    this.windows = {
      '1m': {
        duration: 60,
        samples: []
      },
      // 1分钟窗口（假设每秒采样一次，存60个点）
      '5m': {
        duration: 300,
        samples: []
      },
      // 5分钟窗口
      '15m': {
        duration: 900,
        samples: []
      } // 15分钟窗口
    };
    this.previousCpuTime = {
      total: 0,
      idle: 0
    };
    this.startSampling();
  }

  // 获取 CPU 总时间和空闲时间
  getCpuTime() {
    const cpus = os.cpus();
    let total = 0,
      idle = 0;
    for (const cpu of cpus) {
      const times = cpu.times;
      idle += times.idle;
      total += Object.values(times).reduce((a, b) => a + b, 0);
    }
    return {
      total,
      idle
    };
  }

  // 计算瞬时 CPU 使用率（0.0 ~ 1.0）
  calculateUsage() {
    const current = this.getCpuTime();
    const deltaTotal = current.total - this.previousCpuTime.total;
    const deltaIdle = current.idle - this.previousCpuTime.idle;
    this.previousCpuTime = current;
    if (deltaTotal <= 0 || deltaIdle < 0) return 0; // 避免除零或异常
    const usage = 1 - deltaIdle / deltaTotal;
    return Math.max(0, Math.min(1, usage)); // 确保在合理范围
  }

  // 添加采样数据到窗口
  addSample(usage) {
    for (const key of Object.keys(this.windows)) {
      const window = this.windows[key];
      window.samples.push(usage);
      if (window.samples.length > window.duration) {
        window.samples.shift(); // 移除旧数据，保持窗口长度
      }
    }
  }

  // 计算各窗口的平均值（模拟 loadavg）
  getLoadAvg() {
    const averages = {};
    for (const key of Object.keys(this.windows)) {
      const samples = this.windows[key].samples;
      if (samples.length === 0) {
        averages[key] = 0;
        continue;
      }
      const sum = samples.reduce((a, b) => a + b, 0);
      averages[key] = sum / samples.length;
    }
    return [averages['1m'] * os.cpus().length,
    // 乘以 CPU 核心数以模拟系统负载
    averages['5m'] * os.cpus().length, averages['15m'] * os.cpus().length];
  }

  // 开始定期采样
  async startSampling() {
    while (true) {
      const usage = this.calculateUsage();
      this.addSample(usage);
      // 每秒采样一次
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
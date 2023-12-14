import { Command } from '@tauri-apps/api/shell';
import React from 'react';
import db from '../db';
import FlowLog from '../db/flowLog';

type Stats = {
  totalDownload: number;
  totalUpload: number;
  deltaDownload: number;
  deltaUpload: number;
  uptime: number;
  connected: boolean;
};

type StatItem = {
  name: string;
  value: string;
};

type StatObject = {
  stat: StatItem[];
};

type SysObject = {
  Uptime: number;
};

const queryStats = async () => {
  const stats: Stats = {
    totalDownload: 0,
    totalUpload: 0,
    deltaDownload: 0,
    deltaUpload: 0,
    uptime: 0,
    connected: false,
  };

  if (window.xray.apiPort > 0) {
    const query = Command.sidecar('xray/xray', [
      'api',
      'statsquery',
      `--server=127.0.0.1:${window.xray.apiPort}`,
    ]);
    const sys = Command.sidecar('xray/xray', [
      'api',
      'statssys',
      `--server=127.0.0.1:${window.xray.apiPort}`,
    ]);

    const [querychild, syschild] = await Promise.all([query.execute(), sys.execute()]);

    if (querychild.code === 0) {
      const obj = JSON.parse(querychild.stdout) as StatObject;

      for (const { name, value } of obj.stat) {
        if (name === 'outbound>>>proxy>>>traffic>>>uplink') {
          stats.totalUpload = parseInt(value, 10);
        } else if (name === 'outbound>>>proxy>>>traffic>>>downlink') {
          stats.totalDownload = parseInt(value, 10);
        }
      }
    }

    if (syschild.code === 0) {
      const obj = JSON.parse(syschild.stdout) as SysObject;
      stats.uptime = obj.Uptime;
      stats.connected = true;
    }
  }

  return stats;
};

const useStats = () => {
  const [stats, setStats] = React.useState<Stats>({
    totalDownload: 0,
    totalUpload: 0,
    deltaDownload: 0,
    deltaUpload: 0,
    uptime: 0,
    connected: false,
  });

  React.useEffect(() => {
    const timer = setInterval(async () => {
      const s = await queryStats();
      setStats((old) => {
        const flow: FlowLog = {
          ts: Date.now(),
          download: Math.max(0, s.totalDownload - old.totalDownload),
          upload: Math.max(0, s.totalUpload - old.totalUpload),
        };

        // 保留 10 分钟内的数据
        db.flowLogs
          .where('ts')
          .below(flow.ts - 10 * 60 * 1000)
          .delete()
          .catch(() => {});
        db.flowLogs.add(flow).catch(() => {});

        return {
          ...s,
          deltaDownload: flow.download,
          deltaUpload: flow.upload,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setStats]);

  return stats;
};

export default useStats;

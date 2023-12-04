import { Command } from '@tauri-apps/api/shell';
import React from 'react';
import xray from './xray/xray';

type Stats = {
  download: number;
  upload: number;
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
    download: 0,
    upload: 0,
    uptime: 0,
    connected: false,
  };

  if (xray.apiPort > 0) {
    const query = Command.sidecar('xray/xray', [
      'api',
      'statsquery',
      `--server=127.0.0.1:${xray.apiPort}`,
    ]);
    const sys = Command.sidecar('xray/xray', [
      'api',
      'statssys',
      `--server=127.0.0.1:${xray.apiPort}`,
    ]);

    const [querychild, syschild] = await Promise.all([query.execute(), sys.execute()]);

    if (querychild.code === 0) {
      const obj = JSON.parse(querychild.stdout) as StatObject;

      for (const { name, value } of obj.stat) {
        if (name === 'outbound>>>proxy>>>traffic>>>uplink') {
          stats.upload = parseInt(value, 10);
        } else if (name === 'outbound>>>proxy>>>traffic>>>downlink') {
          stats.download = parseInt(value, 10);
        }
      }
    }

    if (syschild.code === 0) {
      const obj = JSON.parse(syschild.stdout) as SysObject;
      stats.uptime = obj.Uptime;
    }

    stats.connected = true;
  }

  return stats;
};

const useStats = () => {
  const [stats, setStats] = React.useState<Stats>({
    download: 0,
    upload: 0,
    uptime: 0,
    connected: false,
  });

  React.useEffect(() => {
    const timer = setInterval(async () => {
      setStats(await queryStats());
    }, 1000);

    return () => clearInterval(timer);
  }, [setStats]);

  return stats;
};

export default useStats;

import { invoke } from '@tauri-apps/api/tauri';
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

const queryStats = async () => {
  const stats = {
    totalDownload: 0,
    totalUpload: 0,
  };

  if (window.xray.apiPort > 0) {
    try {
      const result = await invoke<Stats>('query_stats', { apiPort: window.xray.apiPort });
      stats.totalUpload = result.totalUpload;
      stats.totalDownload = result.totalDownload;
    } catch (e) {
      // Do nothing
    }
  }

  return stats;
};

const querySys = async () => {
  const stats = {
    uptime: 0,
    connected: false,
  };

  if (window.xray.apiPort > 0) {
    try {
      const result = await invoke<Stats>('query_sys', { apiPort: window.xray.apiPort });
      stats.uptime = result.uptime;
      stats.connected = true;
    } catch (e) {
      // Do nothing
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
      const [s, sys] = await Promise.all([queryStats(), querySys()]);
      setStats((old) => {
        const flow: FlowLog = {
          ts: Date.now(),
          download: Math.max(0, s.totalDownload - old.totalDownload),
          upload: Math.max(0, s.totalUpload - old.totalUpload),
        };

        // 保留 2 分钟内的数据
        db.flowLogs
          .where('ts')
          .below(flow.ts - 2 * 60 * 1000)
          .delete()
          .catch(() => {});
        db.flowLogs.add(flow).catch(() => {});

        return {
          ...s,
          ...sys,
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

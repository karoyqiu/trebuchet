import { entity } from 'simpler-state';
import db from '../db';
import FlowLog from '../db/flowLog';
import useEvent from './useEvent';

type AllStats = { totalDownload: number; totalUpload: number; uptime: number };

type Stats = AllStats & {
  deltaDownload: number;
  deltaUpload: number;
  connected: boolean;
};

const stats = entity<Stats>({
  totalDownload: 0,
  totalUpload: 0,
  deltaDownload: 0,
  deltaUpload: 0,
  uptime: 0,
  connected: false,
});

const useStats = () => {
  const s = stats.use();

  useEvent<AllStats>('app://stats', (event) => {
    const flow: FlowLog = {
      ts: Date.now(),
      download: Math.max(0, event.payload.totalDownload - s.totalDownload),
      upload: Math.max(0, event.payload.totalUpload - s.totalUpload),
    };

    // 保留 2 分钟内的数据
    db.flowLogs
      .where('ts')
      .below(flow.ts - 2 * 60 * 1000)
      .delete()
      .catch(() => {});
    db.flowLogs.add(flow).catch(() => {});

    stats.set({
      ...event.payload,
      connected: true,
      deltaDownload: flow.download,
      deltaUpload: flow.upload,
    });
  });

  return s;
};

export default useStats;

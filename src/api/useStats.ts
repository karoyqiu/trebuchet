import type { Event } from '@tauri-apps/api/event';
import { useCallback } from 'react';
import { entity } from 'simpler-state';
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

  const handleStats = useCallback((event: Event<AllStats>) => {
    const deltaDownload = Math.max(0, event.payload.totalDownload - s.totalDownload);
    const deltaUpload = Math.max(0, event.payload.totalUpload - s.totalUpload);

    stats.set({
      ...event.payload,
      connected: true,
      deltaDownload,
      deltaUpload,
    });
  }, []);

  useEvent<AllStats>('app://stats', handleStats);

  return s;
};

export default useStats;

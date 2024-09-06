import { entity } from 'simpler-state';
import { dbCountEndpoints, dbQueryEndpoints } from '../api/bindings';

export type { Endpoint } from '../api/bindings';

const queryEndpoints = async () => {
  const items = await dbQueryEndpoints();
  items.sort((a, b) => (a.latency ?? 999999) - (b.latency ?? 999999));
  return items;
};

export const endpoints = entity(queryEndpoints());
export const endpointCount = entity(dbCountEndpoints());

export const reloadEndpoints = async () => {
  const [items, count] = await Promise.all([queryEndpoints(), dbCountEndpoints()]);

  endpoints.set(items);
  endpointCount.set(count);
};

import { entity } from 'simpler-state';
import { dbCountEndpoints, dbQueryEndpoints } from '../api/bindings';

export type { Endpoint } from '../api/bindings';

export const endpoints = entity(dbQueryEndpoints());
export const endpointCount = entity(dbCountEndpoints());

export const reloadEndpoints = async () => {
  const [items, count] = await Promise.all([dbQueryEndpoints(), dbCountEndpoints()]);

  endpoints.set(items);
  endpointCount.set(count);
};

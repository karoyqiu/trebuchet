import { entity } from 'simpler-state';
import { dbQueryWebsites } from '../api/bindings';

export type { Website } from '../api/bindings';

export const websites = entity(dbQueryWebsites());

export const reloadWebsites = async () => {
  const items = await dbQueryWebsites();
  websites.set(items);
};

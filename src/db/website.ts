import { entity } from 'simpler-state';
import { object, string } from 'yup';
import { dbQueryWebsites } from '../api/bindings';

export type { Website } from '../api/bindings';

export const websites = entity(dbQueryWebsites());

export const reloadWebsites = async () => {
  const items = await dbQueryWebsites();
  websites.set(items);
};

export const websiteSchema = object({
  name: string().required(),
  url: string().required(),
});
